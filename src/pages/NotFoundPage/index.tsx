import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { APP_ROUTES } from '../../config/constants';
import { PrismMark } from '../../components/ui/PrismMark';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page page-container">
      <div className="not-found-inner">
        <div className="not-found-mark">
          <PrismMark />
        </div>
        <div className="not-found-code label-caps">404</div>
        <h1 className="not-found-headline">Page not found</h1>
        <p className="not-found-body">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate(APP_ROUTES.HOME)} id="btn-return-home">
          Return to Home
        </Button>
      </div>
    </div>
  );
}