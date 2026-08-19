import './PrivacyPage.css';

export default function PrivacyPage() {
  return (
    <div className="privacy-page page-container">
      <header className="privacy-header">
        <div className="label-caps" style={{ color: 'var(--color-accent-secondary)', marginBottom: 'var(--space-2)' }}>
          Legal
        </div>
        <h1>Privacy Policy</h1>
        <p className="privacy-intro">
          Prism Method is designed around a single principle: your media is your property.
          This page documents what we collect, what we don't, and why.
        </p>
      </header>

      <section className="privacy-section">
        <h2>Local Browser Processing</h2>
        <p>
          Prism Method processes your video directly on your device using your web browser's
          WebAssembly runtime. We do not upload your media to a remote server for processing.
          Your video file is read locally using the browser File API and processed in-memory.
        </p>
      </section>

      <section className="privacy-section">
        <h2>No Analytics or Tracking</h2>
        <p>
          We do not implement advertising trackers, third-party analytics scripts, telemetry,
          or tracking pixels. We do not collect browsing history, device fingerprints,
          or metadata from your video files.
        </p>
      </section>

      <section className="privacy-section">
        <h2>TikTok Credentials</h2>
        <p>
          Prism Method and Prism Companion will never ask for, collect, store, or transmit
          your TikTok passwords, session cookies, or authentication tokens. Prism Companion
          interacts with the TikTok Studio file input field only — it does not read account
          data or inject credentials.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Prism Companion Extension</h2>
        <p>
          Prism Companion requests only the minimum browser permissions required to route
          the output file into the TikTok Studio upload interface. It does not access
          other tabs, collect unrelated browsing history, or communicate with Prism servers.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Changes to This Policy</h2>
        <p>
          If our data practices change materially, this page will be updated. As long as
          Prism remains a browser-first, local-processing tool, these core privacy
          properties will be preserved.
        </p>
      </section>
    </div>
  );
}