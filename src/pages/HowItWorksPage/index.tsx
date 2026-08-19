import { WorkflowTimeline } from '../../components/ui/WorkflowTimeline';
import './HowItWorksPage.css';

export default function HowItWorksPage() {
  return (
    <div className="how-page page-container">
      <header className="how-page-header">
        <div className="label-caps" style={{ color: 'var(--color-accent-secondary)', marginBottom: 'var(--space-2)' }}>
          Documentation
        </div>
        <h1>How Prism Works</h1>
        <p className="how-page-intro">
          Prism is a media engineering tool that prepares your source file for reliable
          platform publishing. It performs targeted, transparent transformations and
          never uploads your video to a remote server.
        </p>
      </header>

      <section className="how-timeline-section">
        <WorkflowTimeline />
      </section>

      <section className="how-steps-section">
        <div className="how-step">
          <div className="how-step-number label-caps">01 — Analyze</div>
          <div className="how-step-body">
            <h2>Source analysis</h2>
            <p>
              When you drop a file, Prism reads it in the browser using the
              WebAssembly port of FFprobe. It extracts: video codec, container format,
              resolution, frame rate (CFR or VFR), bitrate, color space, audio codec,
              sample rate, and duration.
            </p>
            <p>
              No data leaves your device during this step. The file is read
              locally using the browser's File API.
            </p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-step-number label-caps">02 — Optimize</div>
          <div className="how-step-body">
            <h2>Targeted transformation</h2>
            <p>
              Prism selects the least destructive transformation based on the
              analysis result. If your file is already in a compatible codec,
              container, and frame rate, it is passed through without re-encoding.
            </p>
            <p>
              Common transformations include: VFR → CFR conversion, frame rate
              capping, codec remux, and controlled bitrate normalization.
              Prism does not blindly re-encode every file.
            </p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-step-number label-caps">03 — Validate</div>
          <div className="how-step-body">
            <h2>Output verification</h2>
            <p>
              Before presenting the output file, Prism runs a series of checks:
              decoder compatibility, audio/video synchronization, frame pacing
              consistency, and container integrity.
            </p>
            <p>
              Every transformation that was applied is displayed clearly
              before you download the file.
            </p>
          </div>
        </div>

        <div className="how-step">
          <div className="how-step-number label-caps">04 — Upload</div>
          <div className="how-step-body">
            <h2>Platform handoff</h2>
            <p>
              You can download the optimized file directly, or use Prism
              Companion — a browser extension — to route the file into
              TikTok Studio's file input field automatically.
            </p>
            <p>
              Prism cannot control TikTok's server-side processing pipeline.
              After upload, TikTok applies its own encoding. Prism prepares
              the best possible source; it cannot guarantee delivery properties.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}