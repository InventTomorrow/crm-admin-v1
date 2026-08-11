import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Last-resort catch for render/chunk errors — Tailwick-styled fallback card. */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-md text-center">
          <div className="card-body space-y-3 py-10">
            <h4 className="text-lg font-semibold text-default-800">Something went wrong</h4>
            <p className="text-sm text-default-500">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn bg-primary text-white"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
