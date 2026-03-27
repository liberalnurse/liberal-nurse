import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Une erreur est survenue dans cette page
          </p>
          <pre className="max-w-full overflow-auto rounded bg-red-100 px-3 py-2 text-left text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
            {this.state.error.message}
          </pre>
          <button
            onClick={this.reset}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-900 dark:text-red-300"
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
