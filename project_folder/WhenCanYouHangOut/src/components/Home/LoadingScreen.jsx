import React from 'react';

/**
 * Loading Screen Component
 * Shown while data is being loaded
 */
function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                
                <h2>Loading Your Schedules...</h2>
                <p>Please wait while we fetch your data</p>
                
                <div className="loading-dots">
                    <span className="dot dot-1"></span>
                    <span className="dot dot-2"></span>
                    <span className="dot dot-3"></span>
                </div>
            </div>
        </div>
    );
}

export default LoadingScreen;
