// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Component } from "react";
import type { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showStack: boolean;
}

/**
 * Top-level error boundary that catches catastrophic React errors.
 * Uses only native HTML and inline styles to avoid dependency on components/CSS.
 * For route-level errors, use RouteError component instead.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, showStack: true };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, showStack: false });
    window.location.reload();
  };

  toggleStack = () => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  render() {
    if (this.state.hasError) {
      const { error, showStack } = this.state;

      // Inline styles only - no Tailwind/CSS dependencies
      // Colors match dark theme: primary purple (#8b5cf6), background (#141414), etc.
      const styles = {
        container: {
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily:
            'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          backgroundColor: "#141414", // --background dark
          color: "#fafafa", // --foreground dark
        },
        content: {
          width: "100%",
          maxWidth: "42rem",
        },
        header: {
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
        },
        icon: {
          fontSize: "2rem",
        },
        title: {
          fontSize: "1.5rem",
          fontWeight: "bold",
          margin: 0,
        },
        errorBox: {
          backgroundColor: "rgba(239, 68, 68, 0.1)", // red-500 at 10%
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "0.5rem",
          padding: "1rem",
          marginBottom: "1rem",
        },
        errorMessage: {
          color: "#f87171", // red-400
          fontFamily:
            '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, monospace',
          fontSize: "0.875rem",
          margin: 0,
          wordBreak: "break-word" as const,
        },
        buttonGroup: {
          display: "flex",
          flexWrap: "wrap" as const,
          gap: "0.5rem",
          marginBottom: "1rem",
        },
        buttonPrimary: {
          backgroundColor: "#8b5cf6", // --primary (violet-500)
          color: "#f5f3ff", // violet-50
          border: "none",
          borderRadius: "0.5rem",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
        },
        buttonOutline: {
          backgroundColor: "transparent",
          color: "#fafafa",
          border: "1px solid rgba(255, 255, 255, 0.1)", // --border dark
          borderRadius: "0.5rem",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
        },
        stackBox: {
          backgroundColor: "#262626", // --muted dark
          borderRadius: "0.5rem",
          padding: "1rem",
          overflowX: "auto" as const,
          marginBottom: "1rem",
        },
        stackText: {
          color: "#a3a3a3", // --muted-foreground dark
          fontSize: "0.75rem",
          whiteSpace: "pre-wrap" as const,
          wordBreak: "break-word" as const,
          margin: 0,
          fontFamily:
            '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, monospace',
        },
        hint: {
          color: "#737373", // neutral-500
          fontSize: "0.875rem",
          margin: 0,
        },
      };

      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>Something went wrong!</h1>

            {error && (
              <div style={styles.errorBox}>
                <p style={styles.errorMessage}>{error.message}</p>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={this.handleReset}
                style={styles.buttonPrimary}
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={this.toggleStack}
                style={styles.buttonOutline}
              >
                {showStack ? "Hide" : "Show"} Error Details
              </button>
            </div>

            {showStack && error?.stack && (
              <div style={styles.stackBox}>
                <pre style={styles.stackText}>{error.stack}</pre>
              </div>
            )}

            <p style={styles.hint}>
              If this keeps happening, try clearing your browser cache or
              opening in a private window.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
