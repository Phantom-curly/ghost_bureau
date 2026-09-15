import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown): void {
    console.error(error)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <p className="error-message">
          Что-то пошло не так в приложении. Обновите страницу, чтобы начать заново.
        </p>
      )
    }
    return this.props.children
  }
}
