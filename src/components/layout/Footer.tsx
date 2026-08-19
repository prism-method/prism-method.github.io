import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../config/constants';
import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.1em' }}>
            PRISM METHOD
          </span>
          <p className="footer-tagline">
            Professional video preparation.
          </p>
        </div>
        
        <div className="footer-links">
          <Link to={APP_ROUTES.HOW_IT_WORKS}>How it works</Link>
          <Link to={APP_ROUTES.PRIVACY}>Privacy</Link>
          <a href="#">Discord</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {year} Prism Method. Not affiliated with TikTok.</p>
      </div>
    </footer>
  );
}