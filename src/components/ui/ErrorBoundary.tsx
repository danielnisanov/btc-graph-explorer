'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  resetId: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, resetId: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error
    console.error('❌ ErrorBoundary caught error:', error);
    console.error('Component stack:', info.componentStack);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  handleRetry = () => {
    // Call optional callback (e.g., to retry a failed fetch)
    if (this.props.onRetry) {
      try {
        this.props.onRetry();
      } catch (e) {
        console.error('onRetry callback failed:', e);
      }
    }

    // Reset error state and force children remount
    this.setState((s) => ({
      hasError: false,
      error: null,
      resetId: s.resetId + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-6 m-6 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
        >
          <div className="max-w-xl mx-auto text-center">
            {/* Error title */}
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Something went wrong</h3>

            {/* Error description */}
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              An unexpected error occurred while loading this part of the app.
            </p>

            {/* Error details (expandable) */}
            {this.state.error.message && (
              <details className="mt-3 text-left">
                <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:text-red-700">
                  Show technical details
                </summary>
                <pre className="mt-2 text-xs bg-white dark:bg-gray-900 p-3 rounded overflow-auto text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  {this.state.error.message}
                  {this.state.error.stack && '\n\n' + this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                autoFocus
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
                aria-label="Retry loading this section"
              >
                🔄 Retry
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md border border-gray-300 dark:border-gray-700 transition-colors text-sm"
                aria-label="Reload the entire page"
              >
                ⟳ Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    // No error: render children normally (using resetId key to force remount after retry)
    return <div key={this.state.resetId}>{this.props.children}</div>;
  }
}

export default ErrorBoundary;
