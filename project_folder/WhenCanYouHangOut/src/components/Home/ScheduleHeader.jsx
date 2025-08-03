import React from 'react';
import { formatTimeDisplay } from '../../utils/timeUtils.js';

/**
 * Schedule Header Component
 * Shows user info, quick stats, and save status
 */
function ScheduleHeader({ user, scheduleStats, lastSaved, saving }) {
    const getTimeAgo = (date) => {
        if (!date) return 'Never';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };
    
    return (
        <header className="schedule-header">
            <div className="header-content">
                <div className="user-info">
                    <h1>Welcome back, {user?.username || 'User'}</h1>
                    <p className="subtitle">Manage your availability and coordinate with friends</p>
                </div>
                
                {scheduleStats && (
                    <div className="quick-stats">
                        <div className="stat-item">
                            <span className="stat-value">{scheduleStats.freePercentage}%</span>
                            <span className="stat-label">Free Time</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{scheduleStats.totalEvents}</span>
                            <span className="stat-label">Events</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{scheduleStats.averageEventsPerDay}</span>
                            <span className="stat-label">Avg/Day</span>
                        </div>
                    </div>
                )}
                
                <div className="save-status">
                    {saving && (
                        <div className="status-indicator saving">
                            <div className="spinner"></div>
                            <span>Saving...</span>
                        </div>
                    )}
                    
                    {!saving && lastSaved && (
                        <div className="status-indicator saved">
                            <div className="check-icon">✓</div>
                            <span>Saved {getTimeAgo(lastSaved)}</span>
                        </div>
                    )}
                    
                    {!saving && !lastSaved && (
                        <div className="status-indicator pending">
                            <span>No changes</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default ScheduleHeader;
