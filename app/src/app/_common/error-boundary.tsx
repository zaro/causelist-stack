import React, { Component, ErrorInfo, ReactNode } from "react";
import { FetcherError } from "./fetcher-error.ts";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  subscriptionRequired?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      let subscriptionRequired =
        this.state.error instanceof FetcherError &&
        this.state.error.status === 402;
      return subscriptionRequired && this.props.subscriptionRequired
        ? this.props.subscriptionRequired
        : this.props.fallback;
    }

    return this.props.children;
  }
}
