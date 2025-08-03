import React from 'react';

/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }
    }
    
    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Reload the page as a last resort
        window.location.reload();
    };
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-icon">⚠️</div>
                        <h2>Something went wrong</h2>
                        <p>We're sorry, but something unexpected happened. This is likely a temporary issue.</p>
                        
                        <div className="error-actions">
                            <button onClick={this.handleReset} className="retry-btn">
                                Reload Page
                            </button>
                            <button 
                                onClick={() => window.history.back()} 
                                className="back-btn"
                            >
                                Go Back
                            </button>
                        </div>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Error Details (Development)</summary>
                                <pre className="error-stack">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }
        
        return this.props.children;
    }
}

export default ErrorBoundary;
