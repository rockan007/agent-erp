import React, { Component } from 'react';
import { Result, Button } from 'antd';

export class ErrorBoundary extends Component<
{ children: React.ReactNode },
{ hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    const { children } = this.props;
    const { hasError } = this.state;
    if (prevProps.children !== children && hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong rendering this view."
          extra={(
            <Button type="primary" onClick={() => this.setState({ hasError: false })}>
              Retry
            </Button>
          )}
        />
      );
    }
    return children;
  }
}
