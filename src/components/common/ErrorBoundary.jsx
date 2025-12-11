import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';

/**
 * RouteErrorBoundary - For React Router errors
 * Catches errors at route level and displays user-friendly UI
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [hasNavigated, setHasNavigated] = React.useState(false);

  // Handle null/undefined errors gracefully - just navigate home ONCE
  React.useEffect(() => {
    if ((!error || error === null) && !hasNavigated) {
      console.warn('Route Error triggered with null/undefined error - redirecting to home');
      setHasNavigated(true);
      navigate('/', { replace: true });
    }
  }, [error, navigate, hasNavigated]);

  // If error is null, show nothing while redirecting
  if (!error || error === null) {
    return null;
  }

  console.error('Route Error:', error);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Error Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border-2 border-red-200 dark:border-red-900">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10 text-white animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Oops!</h1>
                <p className="text-red-100 text-sm">Something went wrong</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-3 space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              {error?.statusText || error?.message || 'An unexpected error occurred while loading this page.'}
            </p>

            {/* Error Status Code */}
            {error?.status && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">Error Code:</span> {error.status}
                </p>
              </div>
            )}

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error?.stack && (
              <details className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                  View Stack Trace (Development)
                </summary>
                <pre className="mt-3 text-xs text-slate-700 dark:text-slate-300 overflow-auto max-h-48 bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-600 font-mono">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white font-medium rounded-lg transition-colors duration-200 text-sm"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
            >
              Go Home
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center mt-4 text-xs text-slate-400">
          If the problem persists, please contact our support team.
        </p>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary - Class component for catching errors in child components
 * Wraps the entire component tree to catch unexpected errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
          <div className="w-full max-w-md">
            {/* Error Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border-2 border-red-200 dark:border-red-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-white animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Oops!</h1>
                    <p className="text-red-100 text-sm">Unexpected error occurred</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-3 space-y-4">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  We encountered an unexpected error. Our team has been notified and is working to fix it.
                </p>

                {/* Error Message */}
                {this.state.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-xs font-mono text-red-800 dark:text-red-300 break-words line-clamp-3">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                      View Stack Trace (Development)
                    </summary>
                    <pre className="mt-3 text-xs text-slate-700 dark:text-slate-300 overflow-auto max-h-48 bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-600 font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                {/* Error Count */}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Errors encountered: <span className="font-semibold text-red-600">{this.state.errorCount}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  Go Home
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  Reload
                </button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-center mt-4 text-xs text-slate-400">
              If the problem persists, please contact support@example.com
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
