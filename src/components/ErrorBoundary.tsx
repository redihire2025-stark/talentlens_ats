import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches unexpected render errors anywhere in the app so a bug never
 * leaves the user on a blank white screen (see "ERROR STATES" in
 * AGENTS.md) — the last line of defense behind each screen's own
 * empty/error states. Deliberately logs only the error object, never
 * resume/JD content, which never passes through this boundary's state.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected application error:', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-background text-foreground">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-8">
            An unexpected error occurred. Your resume content was not affected — it only ever lives in this
            browser tab's memory.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.reset}
              className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-border text-sm font-medium rounded-xl hover:bg-muted transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    )
  }
}
