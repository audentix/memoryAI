import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

/**
 * Error Boundary — catches render errors and shows a fallback UI
 * Prevents one component crash from killing the entire app
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Production error reporting hook
    if (import.meta.env.PROD) {
      // Replace with Sentry/LogRocket/etc
      console.error('[ErrorBoundary]', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="w-12 h-12 rounded-xl bg-danger/15 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-danger" />
          </div>
          <h2 className="text-lg font-semibold text-text mb-1">
            {this.props.title || 'Something went wrong'}
          </h2>
          <p className="text-sm text-text-muted mb-4 max-w-sm">
            {this.props.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={this.handleReset}>
              <RefreshCw size={14} /> Try Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = '/dashboard')}
            >
              <Home size={14} /> Dashboard
            </Button>
          </div>
          {import.meta.env.DEV && this.state.errorInfo && (
            <details className="mt-6 text-left max-w-lg w-full">
              <summary className="text-xs text-text-muted cursor-pointer">
                Error details (dev only)
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-surface-light text-xs text-danger overflow-auto max-h-48">
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for route-level protection
 */
export function withErrorBoundary(Component, options = {}) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
