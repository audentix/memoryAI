import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/shared/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-text mb-2">Page not found</h1>
        <p className="text-text-muted mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          <Home size={16} /> Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
