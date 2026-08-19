import { useState, useRef, useCallback, useEffect } from 'react';
import type { MediaInfo, WorkerOutMessage } from '../types/media';
import { UPLOAD_LIMIT_BYTES } from '../config/constants';

// ── Processing state ─────────────────────────────────────────────────────────

export type ProcessorStatus =
  | 'idle'
  | 'extracting_metadata'
  | 'inspecting'
  | 'ready'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled';

export interface ProcessorState {
  status: ProcessorStatus;
  /** Populated after metadata extraction completes. */
  mediaInfo: MediaInfo | null;
  /** 0–100, only meaningful during 'inspecting' and 'processing'. */
  progress: number;
  /** Human-readable stage description from the worker. */
  stage: string;
  /** Set when status === 'error'. */
  errorMessage: string | null;
  /** Object URL of the output file. Revoked on reset or unmount. */
  outputUrl: string | null;
  /** Name to use for the downloaded file. */
  outputFilename: string | null;
  /** The actual output File object, used for Companion handoff. */
  outputFile: File | null;
  /** Actual transformations applied during optimization. */
  transformations: string[];
}

const initialState: ProcessorState = {
  status: 'idle',
  mediaInfo: null,
  progress: 0,
  stage: '',
  errorMessage: null,
  outputUrl: null,
  outputFilename: null,
  outputFile: null,
  transformations: [],
};

// ── Metadata extraction (main thread — HTMLVideoElement required) ─────────────

/**
 * Extracts duration, dimensions, and track presence from a video File
 * using a hidden HTMLVideoElement. Must run on the main thread because
 * Web Workers do not have access to the DOM.
 *
 * Cleans up all allocated resources (object URLs, video elements) on
 * completion or error.
 */
function extractVideoMetadata(file: File): Promise<Pick<MediaInfo, 'durationSeconds' | 'width' | 'height' | 'hasVideo' | 'hasAudio'>> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load(); // release media resources
    };

    const onLoaded = () => {
      const info = {
        durationSeconds: isFinite(video.duration) ? video.duration : null,
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        hasVideo: video.videoWidth > 0,
        // audioTracks is not universally available in TS DOM lib.
        // Conservatively assume audio is present for typical video files.
        hasAudio: true,
      };
      cleanup();
      resolve(info);
    };

    const onError = () => {
      cleanup();
      // Resolve with nulls — worker will still validate the file.
      resolve({
        durationSeconds: null,
        width: null,
        height: null,
        hasVideo: false,
        hasAudio: false,
      });
    };

    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
    // Timeout guard — some browsers stall on unsupported containers.
    const timer = setTimeout(() => { onError(); }, 5000);
    video.addEventListener('loadedmetadata', () => clearTimeout(timer), { once: true });

    video.src = url;
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseMediaProcessorReturn extends ProcessorState {
  /**
   * Begin inspection of the provided file.
   * Extracts metadata on the main thread, then delegates validation to the worker.
   */
  startInspection: (file: File) => void;
  /**
   * Begin the optimization step.
   * Dispatches the OPTIMIZE command to the Web Worker to perform actual FFmpeg transcoding.
   */
  startOptimization: () => void;
  /** Cancel an in-progress inspection or optimization. Cleans up the worker. */
  cancel: () => void;
  /** Reset back to idle, revoking any output URLs. */
  reset: () => void;
}

export function useMediaProcessor(): UseMediaProcessorReturn {
  const [state, setState] = useState<ProcessorState>(initialState);

  const workerRef = useRef<Worker | null>(null);
  const fileRef = useRef<File | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  // Terminate worker and release resources on unmount.
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }
    };
  }, []);

  const spawnWorker = useCallback(() => {
    workerRef.current?.terminate();
    const worker = new Worker(
      new URL('../workers/mediaWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;
    return worker;
  }, []);

  const revokeOutputUrl = useCallback(() => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
  }, []);

  const startInspection = useCallback(async (file: File) => {
    revokeOutputUrl();
    fileRef.current = file;

    // Step 1: Extract browser-native video metadata on the main thread.
    setState({
      ...initialState,
      status: 'extracting_metadata',
      stage: 'Reading video metadata…',
    });

    let videoMeta: Pick<MediaInfo, 'durationSeconds' | 'width' | 'height' | 'hasVideo' | 'hasAudio'>;
    try {
      videoMeta = await extractVideoMetadata(file);
    } catch {
      videoMeta = { durationSeconds: null, width: null, height: null, hasVideo: false, hasAudio: false };
    }

    const mediaInfo: MediaInfo = {
      filename: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      ...videoMeta,
    };

    // Step 2: Delegate validation + binary inspection to the worker.
    setState((prev) => ({
      ...prev,
      status: 'inspecting',
      mediaInfo,
      stage: 'Starting inspection…',
      progress: 0,
    }));

    const worker = spawnWorker();

    worker.onmessage = async (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'PROGRESS':
          setState((prev) => ({
            ...prev,
            progress: msg.percent,
            stage: msg.stage,
          }));
          break;

        case 'INSPECTION_COMPLETE':
          setState((prev) => ({
            ...prev,
            status: 'ready',
            progress: 100,
            stage: 'Ready for optimization',
            mediaInfo: msg.mediaInfo,
          }));
          break;

        case 'OPTIMIZATION_TRANSFORMATIONS':
          setState((prev) => ({
            ...prev,
            transformations: msg.transformations,
          }));
          break;

        case 'OPTIMIZATION_COMPLETE': {
          revokeOutputUrl();
          outputUrlRef.current = msg.blobUrl;
          
          try {
            // Fetch the Blob from the URL created by the worker
            const res = await fetch(msg.blobUrl);
            const blob = await res.blob();
            const outputFile = new File([blob], msg.filename, { type: blob.type });

            setState((prev) => ({
              ...prev,
              status: 'success',
              progress: 100,
              stage: 'Complete',
              outputUrl: msg.blobUrl,
              outputFilename: msg.filename,
              outputFile,
            }));
          } catch (e) {
            setState((prev) => ({
              ...prev,
              status: 'error',
              errorMessage: 'Failed to construct optimized file object for handoff.',
            }));
          }
          break;
        }

        case 'VALIDATION_ERROR':
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: msg.reason,
          }));
          worker.terminate();
          workerRef.current = null;
          break;

        case 'ERROR':
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: msg.message,
          }));
          worker.terminate();
          workerRef.current = null;
          break;

        case 'CANCELLED':
          setState((prev) => ({ ...prev, status: 'cancelled' }));
          worker.terminate();
          workerRef.current = null;
          break;
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: `Worker error: ${event.message || 'Unknown error.'}`,
      }));
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ type: 'INSPECT', file, limitBytes: UPLOAD_LIMIT_BYTES });
  }, [spawnWorker, revokeOutputUrl]);

  const startOptimization = useCallback(() => {
    const file = fileRef.current;
    if (!file || !state.mediaInfo) return;

    setState((prev) => ({
      ...prev,
      status: 'processing',
      progress: 0,
      stage: 'Starting optimization…',
      transformations: [], // reset transformations
    }));

    if (!workerRef.current) {
        workerRef.current = spawnWorker();
    }
    
    workerRef.current.postMessage({ type: 'OPTIMIZE', file, mediaInfo: state.mediaInfo });
  }, [state.mediaInfo, spawnWorker]);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL' });
      // Terminate immediately; the CANCELLED message may not arrive if already done.
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState((prev) => ({ ...prev, status: 'cancelled' }));
  }, []);

  const reset = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    fileRef.current = null;
    revokeOutputUrl();
    setState(initialState);
  }, [revokeOutputUrl]);

  return { ...state, startInspection, startOptimization, cancel, reset };
}
