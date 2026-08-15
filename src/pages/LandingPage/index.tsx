
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { APP_ROUTES } from '../../config/constants';
import { Icon } from '../../components/ui/Icon';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 'var(--space-12) var(--space-6)', maxWidth: 'var(--layout-max-width)', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', margin: 'var(--space-16) 0 var(--space-24)' }} className="animate-slide-up">
        <img src="/banner.png" alt="Prism Method Banner" style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-8)', boxShadow: '0 8px 32px rgba(138, 43, 226, 0.2)' }} />
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', letterSpacing: '-0.02em', marginBottom: 'var(--space-6)' }}>
          Video preparation <br />
          <span className="text-gradient">for content creators</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
          Prism Method is a privacy-first platform that helps you preserve the quality, frame rate, and reliability of your media before publishing.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <Button size="lg" onClick={() => navigate(APP_ROUTES.UPLOAD)}>
            Start Processing
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate(APP_ROUTES.HOW_IT_WORKS)}>
            How it works
          </Button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-24)' }}>
        <Card glow className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--space-4)' }}>
            <Icon name="check" size={32} />
          </div>
          <h3>Local Processing</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Media is processed directly in your browser. We don't upload your private videos to a remote server unless strictly required.
          </p>
        </Card>
        
        <Card glow className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--space-4)' }}>
            <Icon name="check" size={32} />
          </div>
          <h3>High Fidelity</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Preserve your source resolution and frame rate. We analyze your media to find the least destructive transformation necessary.
          </p>
        </Card>

        <Card glow className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--space-4)' }}>
            <Icon name="check" size={32} />
          </div>
          <h3>Playback Reliability</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Fix VFR sync issues and decoding problems. We prioritize real-world playback stability over empty technical specifications.
          </p>
        </Card>
      </section>
      <section style={{ textAlign: 'center', marginTop: 'var(--space-24)', marginBottom: 'var(--space-12)' }}>
        <img src="/banana.png" alt="Antigravity Banana" style={{ width: '150px', height: '150px', borderRadius: '50%', boxShadow: '0 0 40px rgba(138, 43, 226, 0.4)', animation: 'float 6s ease-in-out infinite' }} />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Powered by Antigravity</p>
      </section>
    </div>
  );
}