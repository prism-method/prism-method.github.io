import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { APP_ROUTES } from '../../config/constants';
import { PrismMark } from '../../components/ui/PrismMark';
import { TechPanel } from '../../components/ui/TechPanel';
import { WorkflowTimeline } from '../../components/ui/WorkflowTimeline';
import { useCompanionStatus } from '../../hooks/useCompanionStatus';
import './LandingPage.css';

const SOURCE_DATA = {
  resolution: '3840×2160',
  fps: '120 FPS',
  codec: 'HEVC',
  bitrate: '42.1 Mbps',
};

const OUTPUT_DATA = {
  resolution: '3840×2160',
  fps: '60 FPS',
  codec: 'H.264',
  bitrate: 'optimized',
};

const FEATURES = [
  {
    id: 'local',
    label: 'LOCAL',
    title: 'Your file stays on your device.',
    body: 'Processing runs entirely in your browser using WebAssembly. No upload, no server, no exposure.',
  },
  {
    id: 'quality',
    label: 'QUALITY',
    title: 'Preserve detail without unnecessary re-encoding.',
    body: "Prism analyzes your source first. If it's already platform-compatible, the file is passed through untouched.",
  },
  {
    id: 'motion',
    label: 'MOTION',
    title: 'Normalize frame pacing for reliable playback.',
    body: 'Variable frame-rate content is converted to constant frame-rate to prevent desync and playback failures.',
  },
  {
    id: 'control',
    label: 'CONTROL',
    title: 'Know exactly what changed before you upload.',
    body: 'Prism shows you every transformation applied — codec, frame rate, container — before you download.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isCompanionInstalled = useCompanionStatus();

  return (
    <div className="landing-page">

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-text animate-slide-up">
            <div className="hero-eyebrow label-caps">Media Engineering Tool</div>
            <h1 className="hero-headline">
              Prepare every frame
              <br />
              <span className="text-gradient">for the upload.</span>
            </h1>
            <p className="hero-body">
              Prism prepares creator videos for reliable platform publishing
              while keeping all processing local, in your browser.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => navigate(APP_ROUTES.UPLOAD)} id="cta-prepare-video">
                Prepare a Video
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate(APP_ROUTES.HOW_IT_WORKS)} id="cta-how-it-works">
                How Prism Works
              </Button>
            </div>
          </div>
          <div className="hero-visual">
            <PrismMark />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="section-inner">
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-block" key={f.id}>
                <div className="feature-label label-caps">{f.label}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="workflow-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="label-caps" style={{ color: 'var(--color-accent-secondary)', marginBottom: 'var(--space-2)' }}>
              How It Works
            </div>
            <h2>Four steps. No guesswork.</h2>
          </div>
          <WorkflowTimeline />
        </div>
      </section>

      {/* ── TECH PANEL ── */}
      <section className="tech-section">
        <div className="section-inner">
          <div className="tech-section-inner">
            <div className="tech-section-text">
              <div className="label-caps" style={{ color: 'var(--color-accent-secondary)', marginBottom: 'var(--space-2)' }}>
                Example Transformation
              </div>
              <h2>Surgical changes. Visible output.</h2>
              <p className="tech-section-body">
                For a 4K 120&nbsp;FPS HEVC source, Prism targets the minimum necessary
                transformation: cap the frame rate to 60&nbsp;FPS and re-encode to H.264
                for broadest decoder compatibility. Resolution is preserved.
              </p>
              <p className="tech-disclaimer">
                Prism optimizes your source file. TikTok applies its own server-side
                encoding after upload. Delivery quality is controlled by the platform,
                not by Prism.
              </p>
            </div>
            <div className="tech-panel-wrapper">
              <TechPanel sourceData={SOURCE_DATA} outputData={OUTPUT_DATA} />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPANION ── */}
      <section id="companion" className="companion-section">
        <div className="section-inner">
          <div className="companion-banner">
            <div className="companion-indicator">
              <div className={`companion-dot ${isCompanionInstalled ? 'connected' : 'disconnected'}`} />
              <span className="companion-status label-caps">
                {isCompanionInstalled ? 'Companion Connected' : 'Prism Companion'}
              </span>
            </div>
            <div className="companion-text">
              {isCompanionInstalled ? (
                <p>Prism Companion is active. After optimization, use "Send to TikTok" to route the file directly into TikTok Studio.</p>
              ) : (
                <p>Install Prism Companion to route your optimized file directly into TikTok Studio without manual file handling.</p>
              )}
            </div>
            {!isCompanionInstalled && (
              <Button size="sm" variant="secondary" id="cta-install-companion">
                Install Companion
              </Button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}