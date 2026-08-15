
import { NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../config/constants';
import './Header.css';

export function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <NavLink to={APP_ROUTES.HOME} className="header-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Prism Method" style={{ height: '32px' }} />
        </NavLink>
        
        <nav className="header-nav">
          <NavLink 
            to={APP_ROUTES.HOME} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to={APP_ROUTES.UPLOAD} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Upload
          </NavLink>
          <NavLink 
            to={APP_ROUTES.HOW_IT_WORKS} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            How it works
          </NavLink>
        </nav>
      </div>
    </header>
  );
}