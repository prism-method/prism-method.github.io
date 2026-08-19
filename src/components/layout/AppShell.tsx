
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import './AppShell.css';
import type { BaseProps } from '../../types';

export function AppShell({ children }: BaseProps) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
}