import React, { useCallback } from 'react';
import { useMediaProcessor } from '../../hooks/useMediaProcessor';
import { DragDropZone } from '../../components/ui/DragDropZone';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatBytes } from '../../utils/format';
import type { MediaInfo } from '../../types/media';
import { useCompanionStatus } from '../../hooks/useCompanionStatus';
import './UploadPage.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatResolution(width: number | null, height: number | null): string {
  if (!width || !height) return '—';
  const label = height >= 2160 ? ' (4K)' : height >= 1440 ? ' (1440p)' : height >= 1080 ? ' (1080p)' : height >= 720 ? ' (720p)' : '';
  return `${width}×${height}${label}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MediaInfoGrid({ info }: { info: MediaInfo }) {
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Filename',   value: info.filename },
    { label: 'Size',       value: formatBytes(info.sizeBytes) },
    { label: 'Type',       value: info.mimeType || 'Unknown' },
    { label: 'Duration',   value: formatDuration(info.durationSeconds) },
    { label: 'Resolution', value: formatResolution(info.width, info.height) },
    { label: 'Video Codec',value: info.codec || 'Unknown' },
    { label: 'Framerate',  value: info.fps ? `${info.fps} FPS${info.isVFR ? ' (VFR)' : ''}` : 'Unknown' },
    { label: 'Audio Codec',value: info.audioCodec ? `${info.audioCodec} (${info.sampleRate} Hz)` : 'None' },
  ];

  return (
    <div className="media-info-grid">
      {fields.map(({ label, value }) => (
        <div key={label} className="media-info-cell">
          <div className="media-info-cell-label">{label}</div>
          <div className="media-info-cell-value">{value}</div>
        </div>
      ))}
    </div>
  );
}

function InspectionProgress({ progress, stage }: { progress: number; stage: string }) {
  return (
    <div className="inspection-progress">
      <div className="inspection-progress-header">
        <span className="inspection-progress-stage">{stage}</span>
        <span className="inspection-progress-pct">{progress}%</span>
      </div>
      <ProgressBar progress={progress} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const {
    status,
    mediaInfo,
    progress,
    stage,
    errorMessage,
    outputUrl,
    outputFilename,
    outputFile,
    transformations,
    startInspection,
    startOptimization,
    cancel,
    reset,
  } = useMediaProcessor();

  const isCompanionInstalled = useCompanionStatus();

  const [handoffStatus, setHandoffStatus] = React.useState<'idle' | 'sent' | 'error'>('idle');
  const [handoffError, setHandoffError] = React.useState<string | null>(null);

  const sendToTikTok = useCallback(() => {
    if (!outputFile) return;
    setHandoffStatus('idle');
    setHandoffError(null);

    const onSent = () => {
      setHandoffStatus('sent');
      window.removeEventListener('prism-handoff-sent', onSent);
      window.removeEventListener('prism-handoff-error', onErr);
    };
    const onErr = (e: Event) => {
      const reason = (e as CustomEvent).detail?.reason ?? 'Handoff failed. Make sure Prism Companion is installed.';
      setHandoffStatus('error');
      setHandoffError(reason);
      window.removeEventListener('prism-handoff-sent', onSent);
      window.removeEventListener('prism-handoff-error', onErr);
    };
    window.addEventListener('prism-handoff-sent', onSent);
    window.addEventListener('prism-handoff-error', onErr);
    window.postMessage({ type: 'PRISM_HANDOFF', file: outputFile }, window.location.origin);
  }, [outputFile]);

  return (
    <div className="upload-page">

      {/* Page header */}
      <div className="upload-header">
        <div className="upload-header-text">
          <h1>Prepare Video</h1>
          <p>Analyze, optimize, and validate your video for platform upload. All processing runs locally.</p>
        </div>
        <Badge variant="warning">Beta</Badge>
      </div>

      <div className="upload-body">

        {/* ── IDLE ── */}
        {status === 'idle' && (
          <DragDropZone
            onFileSelect={startInspection}
            accept="video/mp4,video/quicktime,video/x-m4v,video/webm,.mkv"
          />
        )}

        {/* ── EXTRACTING METADATA ── */}
        {status === 'extracting_metadata' && (
          <Card glow style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Reading File</h3>
            <ProgressBar indeterminate />
            <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {stage}
            </p>
          </Card>
        )}

        {/* ── INSPECTING ── */}
        {status === 'inspecting' && (
          <Card glow>
            <div className="card-row-header">
              <h3>Inspecting File</h3>
              <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
            </div>
            <InspectionProgress progress={progress} stage={stage} />
            {mediaInfo && <MediaInfoGrid info={mediaInfo} />}
          </Card>
        )}

        {/* ── READY ── */}
        {status === 'ready' && mediaInfo && (
          <div className="animate-slide-up upload-body">
            <Card glow>
              <div className="card-row-header">
                <h3>
                  <Icon name="check" size={22} color="var(--color-success)" />
                  Analysis Complete
                </h3>
                <Button variant="ghost" size="sm" onClick={reset}>Change File</Button>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Your media has been analyzed and is ready for optimization.
              </p>
              <MediaInfoGrid info={mediaInfo} />
            </Card>

            <Card className="upload-notice-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {mediaInfo.fps && mediaInfo.fps > 60 && (
                  <div className="fps-warning">
                    <strong>120&nbsp;FPS source detected.</strong>{' '}
                    TikTok-ready output will be capped to 60&nbsp;FPS for platform compatibility.
                  </div>
                )}
                <div className="info-row">
                  <div className="info-row-icon">
                    <Icon name="info" size={22} color="var(--color-accent-secondary)" />
                  </div>
                  <div className="info-row-body">
                    <h4>Prism prepares your source for reliable platform upload.</h4>
                    <p>
                      Prism Method optimizes the source file to preserve resolution, frame-rate integrity,
                      and playback reliability. <strong>Prism cannot control TikTok's server-side
                      processing.</strong> The final quality delivered to viewers depends entirely on
                      TikTok's internal encoding policies.
                    </p>
                    <div className="optimize-action">
                      <Button size="lg" onClick={startOptimization} id="btn-start-optimization">
                        Start Optimization
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {status === 'processing' && (
          <Card glow className="processing-card">
            <div className="processing-card-header">
              <h3>Processing Media</h3>
              <p>Running optimization and output checks…</p>
            </div>
            <InspectionProgress progress={progress} stage={stage} />
          </Card>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && (
          <Card glow className="success-card animate-slide-up">
            <div className="success-icon">
              <Icon name="check" size={64} />
            </div>
            <h3>Ready for Upload</h3>
            <p className="success-desc">
              {isCompanionInstalled ? (
                <strong>Prism Companion is active. Open TikTok Studio to upload.</strong>
              ) : (
                <>To complete the workflow, install Prism Companion for upload assistance in TikTok Studio.</>
              )}
              <br /><br />
              TikTok applies its own server-side encoding after upload.
            </p>

            {transformations && transformations.length > 0 && (
              <div className="transformations-list">
                <h4>Transformations Applied</h4>
                <ul>
                  {transformations.map((t, idx) => (
                    <li key={idx}>
                      <Icon name="check" size={16} color="var(--color-success)" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {handoffError && (
              <div className="handoff-banner error">{handoffError}</div>
            )}
            {handoffStatus === 'sent' && (
              <div className="handoff-banner success">
                ✓ Prism Companion is opening TikTok Studio and attaching your file.
              </div>
            )}

            <div className="success-actions">
              <Button variant="secondary" onClick={reset} id="btn-process-another">Process Another</Button>
              {outputUrl && (
                <a href={outputUrl} download={outputFilename || 'prism_output.mp4'} style={{ textDecoration: 'none' }}>
                  <Button size="lg" id="btn-download-result">
                    <Icon name="download" size={16} style={{ marginRight: '6px' }} />
                    Download
                  </Button>
                </a>
              )}
              {isCompanionInstalled && outputFile && handoffStatus !== 'sent' && (
                <Button size="lg" onClick={sendToTikTok} id="btn-send-tiktok" style={{ background: 'var(--color-accent-primary)' }}>
                  Send to TikTok →
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <Card className="error-card">
            <div className="error-row">
              <div className="error-row-icon">
                <Icon name="alert" size={24} color="var(--color-error)" />
              </div>
              <div className="error-row-body">
                <h3>Processing Failed</h3>
                <p>{errorMessage || 'An unexpected error occurred.'}</p>
                <Button onClick={reset}>Try Another File</Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── CANCELLED ── */}
        {status === 'cancelled' && (
          <Card className="cancelled-card">
            <h3>Cancelled</h3>
            <p>Processing was cancelled. Your file was not modified.</p>
            <Button onClick={reset}>Start Over</Button>
          </Card>
        )}

      </div>
    </div>
  );
}