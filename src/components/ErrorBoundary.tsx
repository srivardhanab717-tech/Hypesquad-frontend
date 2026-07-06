import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary that catches render/lifecycle errors and displays
 * the actual error message + component stack trace on-screen.
 * 
 * This is for development/debugging on a physical device where you
 * can't easily access browser dev tools or adb logcat.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    // Also log to console in case Metro is connected
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>⚠️ App Crashed</Text>
            
            <Text style={styles.sectionHeader}>Error Message:</Text>
            <Text style={styles.errorText} selectable>
              {this.state.error?.message ?? 'Unknown error'}
            </Text>

            <Text style={styles.sectionHeader}>Error Name:</Text>
            <Text style={styles.errorText} selectable>
              {this.state.error?.name ?? 'Error'}
            </Text>

            <Text style={styles.sectionHeader}>Stack Trace:</Text>
            <Text style={styles.stackText} selectable>
              {this.state.error?.stack ?? 'No stack trace available'}
            </Text>

            <Text style={styles.sectionHeader}>Component Stack:</Text>
            <Text style={styles.stackText} selectable>
              {this.state.errorInfo?.componentStack ?? 'No component stack available'}
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
    paddingTop: 60,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ff4444',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff8888',
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#330000',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 11,
    color: '#cccccc',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  retryButton: {
    marginTop: 32,
    backgroundColor: '#ff4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
