// Error Boundary: a class component that catches rendering errors in its
// child tree, logs them, and shows a fallback UI instead of crashing the
// entire app. Uses getDerivedStateFromError (static) to update state and
// componentDidCatch to log error details.

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional label shown in the fallback so the user knows which section failed. */
  sectionLabel?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  // Called during the render phase when a descendant throws. Returns the
  // new state that triggers the fallback UI.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  // Called after the error has been committed to the DOM. Use this for
  // logging / reporting — not for updating state.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.sectionLabel ? ` – ${this.props.sectionLabel}` : ''}]`, error, errorInfo.componentStack)
  }

  // Reset the boundary so children re-render. Called by the "Try again"
  // button in the fallback UI.
  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle size={32} className="text-ink" aria-hidden="true" />
          <h2 className="m-0 text-[1.1rem] font-semibold text-ink">
            {this.props.sectionLabel
              ? `${this.props.sectionLabel} failed to load`
              : 'Something went wrong'}
          </h2>
          <p className="max-w-md text-[0.9rem] text-muted">
            An unexpected error occurred while rendering this section.
          </p>
          {this.state.error && (
            <p className="max-w-lg whitespace-pre-wrap break-words font-mono text-[0.78rem] text-muted">
              {this.state.error.message}
            </p>
          )}
          <button type="button" onClick={this.handleReset} className="mt-2">
            <RefreshCw size={14} aria-hidden="true" /> Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
