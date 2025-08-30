import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class MobileErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Mobile Error Boundary Caught Error:', error);
    console.error('🚨 Error Info:', errorInfo);
    console.error('🚨 Stack:', error.stack);
    console.error('🚨 User Agent:', navigator.userAgent);
    console.error('🚨 Screen Size:', { width: window.innerWidth, height: window.innerHeight });
    
    // Log to a visible element for mobile debugging
    const debugDiv = document.createElement('div');
    debugDiv.id = 'mobile-debug';
    debugDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 999999;
      padding: 20px;
      font-family: monospace;
      font-size: 12px;
      overflow: auto;
      color: black;
    `;
    debugDiv.innerHTML = `
      <h1 style="color: red; margin-bottom: 20px;">🚨 MOBILE ERROR DETECTED</h1>
      <div><strong>Error:</strong> ${error.message}</div>
      <div><strong>Stack:</strong><br><pre>${error.stack}</pre></div>
      <div><strong>Component Stack:</strong><br><pre>${errorInfo.componentStack}</pre></div>
      <div><strong>User Agent:</strong> ${navigator.userAgent}</div>
      <div><strong>Screen:</strong> ${window.innerWidth}x${window.innerHeight}</div>
      <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
    `;
    document.body.appendChild(debugDiv);

    this.setState({ hasError: true, error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          overflow: 'auto',
          zIndex: 999999,
          color: 'black'
        }}>
          <h1 style={{ color: 'red', marginBottom: '20px' }}>🚨 REACT ERROR</h1>
          <div><strong>Error:</strong> {this.state.error?.message}</div>
          <div><strong>Stack:</strong><br/><pre>{this.state.error?.stack}</pre></div>
          {this.state.errorInfo && (
            <div><strong>Component Stack:</strong><br/><pre>{this.state.errorInfo.componentStack}</pre></div>
          )}
          <div><strong>User Agent:</strong> {navigator.userAgent}</div>
          <div><strong>Screen:</strong> {window.innerWidth}x{window.innerHeight}</div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px', fontSize: '14px' }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}