/// <reference lib="WebWorker" />
import type { WorkerInMessage, WorkerOutMessage, MediaInfo } from '../types/media';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let cancelled = false;

function postOut(msg: WorkerOutMessage): void {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);
}

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

function parseFfprobeStderr(stderr: string): Partial<MediaInfo> {
  const result: Partial<MediaInfo> = {};
  
  // Extract Video stream
  const videoMatch = stderr.match(/Stream #\d+:\d+(.*): Video: (.*)/);
  if (videoMatch) {
    result.hasVideo = true;
    const vStr = videoMatch[2];
    
    // Codec
    const codecMatch = vStr.match(/^([a-zA-Z0-9_]+)/);
    if (codecMatch) result.codec = codecMatch[1];
    
    // Pixel format
    const pixFmtMatch = vStr.match(/,\s*([a-zA-Z0-9_]+)(?:\([^)]+\))?,/);
    if (pixFmtMatch) result.pixelFormat = pixFmtMatch[1];
    
    // Dimensions
    const dimMatch = vStr.match(/(\d{2,})x(\d{2,})/);
    if (dimMatch) {
      result.width = parseInt(dimMatch[1], 10);
      result.height = parseInt(dimMatch[2], 10);
    }
    
    // FPS
    const fpsMatch = vStr.match(/([\d.]+)\s*fps/);
    if (fpsMatch) {
       result.fps = parseFloat(fpsMatch[1]);
    }
    
    // VFR check: look for "tbr" and "fps" differences
    const tbrMatch = vStr.match(/([\d.]+)\s*tbr/);
    if (tbrMatch && fpsMatch) {
        const tbr = parseFloat(tbrMatch[1]);
        const fps = parseFloat(fpsMatch[1]);
        if (Math.abs(tbr - fps) > 0.1) {
            result.isVFR = true;
        } else {
            result.isVFR = false;
        }
    } else {
        result.isVFR = false;
    }
  } else {
    result.hasVideo = false;
  }
  
  // Extract Audio
  const audioMatch = stderr.match(/Stream #\d+:\d+(.*): Audio: (.*)/);
  if (audioMatch) {
    result.hasAudio = true;
    const aStr = audioMatch[2];
    
    const codecMatch = aStr.match(/^([a-zA-Z0-9_]+)/);
    if (codecMatch) result.audioCodec = codecMatch[1];
    
    const srMatch = aStr.match(/(\d+)\s*Hz/);
    if (srMatch) result.sampleRate = parseInt(srMatch[1], 10);
  } else {
    result.hasAudio = false;
  }
  
  // Bitrate and Duration
  const durMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (durMatch) {
      const h = parseInt(durMatch[1], 10);
      const m = parseInt(durMatch[2], 10);
      const s = parseFloat(durMatch[3]);
      result.durationSeconds = h * 3600 + m * 60 + s;
  }
  
  const brMatch = stderr.match(/bitrate: (\d+) kb\/s/);
  if (brMatch) {
      result.bitrate = parseInt(brMatch[1], 10) * 1000;
  }

  return result;
}

async function inspect(file: File, limitBytes: number): Promise<void> {
  if (file.size === 0) {
    postOut({ type: 'VALIDATION_ERROR', reason: 'File is empty.' });
    return;
  }
  if (file.size > limitBytes) {
    const limitMB = (limitBytes / (1024 * 1024)).toFixed(0);
    postOut({ type: 'VALIDATION_ERROR', reason: `File size exceeds the ${limitMB} MB limit.` });
    return;
  }

  postOut({ type: 'PROGRESS', percent: 10, stage: 'Loading local media engine...' });
  const ff = await loadFFmpeg();

  postOut({ type: 'PROGRESS', percent: 30, stage: 'Analyzing media properties...' });
  const filename = 'input_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  await ff.writeFile(filename, await fetchFile(file));

  let stderr = '';
  const logHandler = ({ message }: { message: string }) => { stderr += message + '\n'; };
  ff.on('log', logHandler);

  await ff.exec(['-i', filename]);
  ff.off('log', logHandler);
  
  const parsed = parseFfprobeStderr(stderr);
  await ff.deleteFile(filename);

  if (!parsed.hasVideo) {
    postOut({ type: 'VALIDATION_ERROR', reason: 'No video track found in the file.' });
    return;
  }

  postOut({ type: 'PROGRESS', percent: 100, stage: 'Inspection complete' });
  
  const mediaInfo: MediaInfo = {
    filename: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    durationSeconds: parsed.durationSeconds ?? null,
    width: parsed.width ?? null,
    height: parsed.height ?? null,
    hasVideo: !!parsed.hasVideo,
    hasAudio: !!parsed.hasAudio,
    codec: parsed.codec,
    fps: parsed.fps,
    isVFR: parsed.isVFR,
    pixelFormat: parsed.pixelFormat,
    bitrate: parsed.bitrate,
    audioCodec: parsed.audioCodec,
    sampleRate: parsed.sampleRate,
  };

  postOut({ type: 'INSPECTION_COMPLETE', mediaInfo });
}

async function optimize(file: File, mediaInfo: MediaInfo): Promise<void> {
  const ff = await loadFFmpeg();
  
  const inputName = 'input_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const outputName = 'output.mp4';
  
  await ff.writeFile(inputName, await fetchFile(file));
  
  const transformations: string[] = [];
  const args = ['-i', inputName, '-map', '0:v:0', '-map', '0:a:0?', '-movflags', '+faststart', '-y'];

  let needsVideoEncode = false;
  let needsAudioEncode = false;

  if (mediaInfo.codec !== 'h264') {
    needsVideoEncode = true;
    transformations.push(`Video Codec: ${mediaInfo.codec || 'unknown'} -> h264`);
  }

  let targetFps = mediaInfo.fps || 30;
  if (targetFps > 60) {
    needsVideoEncode = true;
    targetFps = 60;
    transformations.push(`Framerate: ${mediaInfo.fps} FPS -> 60 FPS`);
  } else if (mediaInfo.isVFR) {
    needsVideoEncode = true;
    transformations.push(`Framerate: VFR -> CFR (${targetFps} FPS)`);
  }

  let targetWidth = mediaInfo.width;
  let targetHeight = mediaInfo.height;
  if (targetWidth && targetHeight) {
      if (Math.max(targetWidth, targetHeight) > 4096) {
          needsVideoEncode = true;
          const ratio = 4096 / Math.max(targetWidth, targetHeight);
          targetWidth = Math.round((targetWidth * ratio) / 2) * 2;
          targetHeight = Math.round((targetHeight * ratio) / 2) * 2;
          transformations.push(`Resolution: ${mediaInfo.width}x${mediaInfo.height} -> ${targetWidth}x${targetHeight}`);
      }
  }

  if (mediaInfo.pixelFormat && mediaInfo.pixelFormat !== 'yuv420p') {
    needsVideoEncode = true;
    transformations.push(`Pixel Format: ${mediaInfo.pixelFormat} -> yuv420p`);
  }
  
  if (!file.name.toLowerCase().endsWith('.mp4')) {
    transformations.push('Container: Remuxed to MP4');
  }

  if (mediaInfo.hasAudio) {
      if (mediaInfo.audioCodec !== 'aac') {
          needsAudioEncode = true;
          transformations.push(`Audio Codec: ${mediaInfo.audioCodec || 'unknown'} -> aac`);
      }
      if (mediaInfo.sampleRate !== 48000 && mediaInfo.sampleRate !== 44100) {
          needsAudioEncode = true;
          transformations.push(`Audio Sample Rate: ${mediaInfo.sampleRate || 'unknown'} Hz -> 48000 Hz`);
      }
  }

  if (needsVideoEncode) {
      args.push('-c:v', 'libx264');
      args.push('-preset', 'veryfast');
      args.push('-crf', '23');
      args.push('-maxrate', '35M', '-bufsize', '70M');
      
      if (targetWidth && targetHeight && (targetWidth !== mediaInfo.width || targetHeight !== mediaInfo.height)) {
         args.push('-vf', `scale=${targetWidth}:${targetHeight}`);
      }
      args.push('-fps_mode', 'cfr');
      args.push('-r', targetFps.toString());
      args.push('-pix_fmt', 'yuv420p');
  } else {
      args.push('-c:v', 'copy');
  }

  if (needsAudioEncode && mediaInfo.hasAudio) {
      args.push('-c:a', 'aac', '-b:a', '128k');
      args.push('-ar', '48000');
  } else if (mediaInfo.hasAudio) {
      args.push('-c:a', 'copy');
  }

  args.push(outputName);
  
  if (transformations.length === 0) {
      transformations.push('No destructive re-encoding required (Passthrough)');
  }

  postOut({ type: 'OPTIMIZATION_TRANSFORMATIONS', transformations });

  const progressHandler = ({ progress }: { progress: number }) => {
     if (cancelled) {
         ff.terminate();
         ffmpeg = null;
         return;
     }
     const percent = Math.min(Math.max(Math.round(progress * 100), 0), 100);
     postOut({ type: 'PROGRESS', percent, stage: needsVideoEncode ? 'Transcoding video...' : 'Remuxing video...' });
  };
  ff.on('progress', progressHandler);

  await ff.exec(args);
  ff.off('progress', progressHandler);

  if (cancelled) {
      return; 
  }

  postOut({ type: 'PROGRESS', percent: 99, stage: 'Validating output...' });
  let outStderr = '';
  const outLogHandler = ({ message }: { message: string }) => { outStderr += message + '\n'; };
  ff.on('log', outLogHandler);
  await ff.exec(['-i', outputName]);
  ff.off('log', outLogHandler);
  
  const outParsed = parseFfprobeStderr(outStderr);
  const validationErrors: string[] = [];

  if (!outParsed.hasVideo) validationErrors.push('No video track.');
  if (outParsed.codec !== 'h264') validationErrors.push(`Codec is ${outParsed.codec}, expected h264.`);
  if (outParsed.pixelFormat !== 'yuv420p') validationErrors.push(`Pixel format is ${outParsed.pixelFormat}, expected yuv420p.`);
  
  const w = outParsed.width || 0;
  const h = outParsed.height || 0;
  if (w <= 0 || h <= 0) validationErrors.push('Invalid resolution.');
  if (w > 4096 || h > 4096) validationErrors.push(`Resolution ${w}x${h} exceeds 4096px.`);
  if (mediaInfo.width && mediaInfo.height && (w > mediaInfo.width || h > mediaInfo.height)) {
     validationErrors.push(`Upscaling detected: ${w}x${h} is larger than source ${mediaInfo.width}x${mediaInfo.height}.`);
  }

  if (outParsed.fps && outParsed.fps > 60.1) validationErrors.push(`FPS ${outParsed.fps} exceeds 60.`);
  
  if (mediaInfo.hasAudio) {
      if (!outParsed.hasAudio) validationErrors.push('Audio track lost.');
      if (outParsed.audioCodec !== 'aac') validationErrors.push(`Audio codec is ${outParsed.audioCodec}, expected aac.`);
      if (outParsed.sampleRate !== 48000) validationErrors.push(`Audio sample rate is ${outParsed.sampleRate}, expected 48000.`);
  }

  if (mediaInfo.durationSeconds && outParsed.durationSeconds) {
      const diff = Math.abs(mediaInfo.durationSeconds - outParsed.durationSeconds);
      if (diff > 1.0) validationErrors.push(`Duration drift detected: source ${mediaInfo.durationSeconds}s, output ${outParsed.durationSeconds}s.`);
  }

  if (validationErrors.length > 0) {
     postOut({ type: 'VALIDATION_ERROR', reason: `Output validation failed: ${validationErrors.join(' ')}` });
     await ff.deleteFile(inputName).catch(()=>{});
     await ff.deleteFile(outputName).catch(()=>{});
     return;
  }

  const data = await ff.readFile(outputName);
  const blob = new Blob([data as any as BlobPart], { type: 'video/mp4' });
  const blobUrl = URL.createObjectURL(blob);
  
  await ff.deleteFile(inputName).catch(()=>{});
  await ff.deleteFile(outputName).catch(()=>{});
  
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const outFilename = `prism_${baseName}.mp4`;

  postOut({ type: 'OPTIMIZATION_COMPLETE', blobUrl, filename: outFilename });
}

(self as unknown as DedicatedWorkerGlobalScope).addEventListener('message', (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === 'CANCEL') {
    cancelled = true;
    postOut({ type: 'CANCELLED' });
    return;
  }

  if (msg.type === 'INSPECT') {
    cancelled = false;
    inspect(msg.file, msg.limitBytes).catch((err: unknown) => {
      let message = 'Unknown worker error.';
      if (err instanceof Error) message = err.message;
      else if (typeof err === 'string') message = err;
      else if (err && typeof err === 'object') message = JSON.stringify(err);
      postOut({ type: 'ERROR', message: `Inspect error: ${message}` });
    });
  } else if (msg.type === 'OPTIMIZE') {
    cancelled = false;
    optimize(msg.file, msg.mediaInfo).catch((err: unknown) => {
      let message = 'Unknown worker error.';
      if (err instanceof Error) message = err.message;
      else if (typeof err === 'string') message = err;
      else if (err && typeof err === 'object') message = JSON.stringify(err);
      postOut({ type: 'ERROR', message: `Optimize error: ${message}` });
    });
  }
});
