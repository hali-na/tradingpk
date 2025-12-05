'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * 用于捕获子组件树中的JavaScript错误，并显示降级UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以在这里记录错误到日志服务
    console.error('ErrorBoundary捕获到错误:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              发生了一个错误
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || '未知错误'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-xs text-left bg-gray-100 p-3 rounded mb-4 overflow-auto max-h-40">
                {this.state.error.stack}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset}>
                重试
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

