import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../services/api.js';
import { 
    getTimeSlotStatus, 
    generateTimeSlots, 
    DAYS_OF_WEEK,
    formatTimeDisplay,
    mergeTimeRanges 
} from '../utils/timeUtils.js';
import '../css/WeeklyView.css';

function WeeklyView() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    // State management
    const [schedules, setSchedules] = useState({});
    const [activeScheduleId, setActiveScheduleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewSettings, setViewSettings] = useState({
        showWeekends: true,
        startHour: 0,
        endHour: 24,
        timeInterval: 30 // 30-minute intervals for better granularity
    });
    // Memoized computed values for performance
    const activeSchedule = useMemo(() => {
        const result = activeScheduleId && schedules[activeScheduleId] 
            ? schedules[activeScheduleId].schedule 
            : null;
        return result;
    }, [activeScheduleId, schedules]);

    const timeSlots = useMemo(() => {
        return generateTimeSlots(
            viewSettings.startHour, 
            viewSettings.endHour, 
            viewSettings.timeInterval
        );
    }, [viewSettings.startHour, viewSettings.endHour, viewSettings.timeInterval]);

    const displayDays = useMemo(() => {
        return viewSettings.showWeekends 
            ? DAYS_OF_WEEK 
            : DAYS_OF_WEEK.slice(1, 6); // Monday to Friday
    }, [viewSettings.showWeekends]);

    // Memoized schedule data processing
    const processedScheduleData = useMemo(() => {
        if (!activeSchedule) return {};
        
        const processed = {};
        displayDays.forEach(day => {
            if (activeSchedule[day]?.timeRanges) {
                processed[day] = mergeTimeRanges(activeSchedule[day].timeRanges);
            } else {
                processed[day] = [];
            }
        });
        
        return processed;
    }, [activeSchedule, displayDays]);

    // Load schedules when component mounts
    useEffect(() => {
        if (!isAuthenticated || authLoading) return;

        const loadSchedules = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const schedulesData = await apiService.getSchedules();
                
                const schedulesObj = {};
                if (Array.isArray(schedulesData)) {
                    schedulesData.forEach(schedule => {
                        const scheduleId = schedule._id || schedule.id;
                        schedulesObj[scheduleId] = {
                            ...schedule,
                            id: scheduleId
                        };
                    });
                }
                
                setSchedules(schedulesObj);
                
                // Set active schedule to first one if any exist
                const scheduleIds = Object.keys(schedulesObj);
                if (scheduleIds.length > 0 && !activeScheduleId) {
                    setActiveScheduleId(scheduleIds[0]);
                }
            } catch (error) {
                console.error('Error loading schedules:', error);
                setError('Failed to load schedules. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadSchedules();
    }, [isAuthenticated, authLoading, activeScheduleId]);

    // Callback for getting time slot status
    const getSlotStatus = useCallback((day, timeSlot) => {
        return getTimeSlotStatus(activeSchedule, day, timeSlot);
    }, [activeSchedule]);

    // View settings handlers
    const handleViewSettingsChange = useCallback((setting, value) => {
        setViewSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    }, []);

    const handleScheduleChange = useCallback((scheduleId) => {
        setActiveScheduleId(scheduleId);
    }, []);

    // Get schedule statistics
    const scheduleStats = useMemo(() => {
        if (!activeSchedule) return null;
        
        let totalSlots = 0;
        let freeSlots = 0;
        let busySlots = 0;
        let maybeSlots = 0;
        
        displayDays.forEach(day => {
            timeSlots.forEach(timeSlot => {
                totalSlots++;
                const status = getSlotStatus(day, timeSlot);
                switch (status) {
                    case 'free':
                        freeSlots++;
                        break;
                    case 'not-free':
                        busySlots++;
                        break;
                    case 'maybe-free':
                        maybeSlots++;
                        break;
                }
            });
        });
        
        return {
            totalSlots,
            freeSlots,
            busySlots,
            maybeSlots,
            freePercentage: Math.round((freeSlots / totalSlots) * 100),
            busyPercentage: Math.round((busySlots / totalSlots) * 100),
            maybePercentage: Math.round((maybeSlots / totalSlots) * 100)
        };
    }, [activeSchedule, displayDays, timeSlots, getSlotStatus]);

    return (
        <div className="weekly-view-container">
            <header className="weekly-view-header">
                <h1 className="page-header">Weekly Schedule View</h1>
                
                {/* Auth loading state */}
                {authLoading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Checking authentication...</p>
                    </div>
                )}
            </header>
            
            {/* Not authenticated */}
            {!authLoading && !isAuthenticated && (
                <div className="auth-error">
                    <div className="error-icon">🔒</div>
                    <h3>Authentication Required</h3>
                    <p>Please log in to view your schedules.</p>
                </div>
            )}
            
            {/* Loading state */}
            {isAuthenticated && loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading your schedules...</p>
                </div>
            )}
            
            {/* Error state */}
            {isAuthenticated && error && (
                <div className="error-banner">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <div className="error-text">
                            <strong>Error:</strong> {error}
                        </div>
                        <button 
                            className="error-dismiss" 
                            onClick={() => setError(null)}
                            aria-label="Dismiss error"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            
            {/* No schedules message */}
            {isAuthenticated && !loading && Object.keys(schedules).length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Schedules Found</h3>
                    <p>You haven't created any schedules yet.</p>
                    <p>Create your first schedule to see it displayed here!</p>
                </div>
            )}
            
            {/* Main content */}
            {isAuthenticated && !loading && Object.keys(schedules).length > 0 && (
                <div className="weekly-view-content">
                    {/* Controls section */}
                    <div className="controls-section">
                        <div className="schedule-selector">
                            <label htmlFor="schedule-select">Select Schedule:</label>
                            <select 
                                id="schedule-select"
                                value={activeScheduleId || ''}
                                onChange={(e) => handleScheduleChange(e.target.value)}
                                className="schedule-select"
                            >
                                {Object.entries(schedules).map(([id, schedule]) => (
                                    <option key={id} value={id}>
                                        {schedule.name || `Schedule ${id.slice(-4)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="view-controls">
                            <div className="control-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={viewSettings.showWeekends}
                                        onChange={(e) => handleViewSettingsChange('showWeekends', e.target.checked)}
                                    />
                                    Show Weekends
                                </label>
                            </div>
                            
                            <div className="control-group">
                                <label htmlFor="start-hour">Start Hour:</label>
                                <select
                                    id="start-hour"
                                    value={viewSettings.startHour}
                                    onChange={(e) => handleViewSettingsChange('startHour', parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {formatTimeDisplay(`${i.toString().padStart(2, '0')}:00`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="control-group">
                                <label htmlFor="end-hour">End Hour:</label>
                                <select
                                    id="end-hour"
                                    value={viewSettings.endHour}
                                    onChange={(e) => handleViewSettingsChange('endHour', parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                        <option key={hour} value={hour}>
                                            {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Statistics */}
                    {scheduleStats && (
                        <div className="schedule-stats">
                            <h3>Schedule Overview</h3>
                            <div className="stats-grid">
                                <div className="stat-item free">
                                    <div className="stat-value">{scheduleStats.freePercentage}%</div>
                                    <div className="stat-label">Free Time</div>
                                </div>
                                <div className="stat-item busy">
                                    <div className="stat-value">{scheduleStats.busyPercentage}%</div>
                                    <div className="stat-label">Busy Time</div>
                                </div>
                                <div className="stat-item maybe">
                                    <div className="stat-value">{scheduleStats.maybePercentage}%</div>
                                    <div className="stat-label">Maybe Free</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="schedule-legend">
                        <h3>Legend</h3>
                        <div className="legend-items">
                            <div className="legend-item">
                                <div className="legend-color free"></div>
                                <span>Free</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color maybe-free"></div>
                                <span>Maybe Free</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color not-free"></div>
                                <span>Not Free</span>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Grid */}
                    {activeSchedule && (
                        <div className="schedule-wrapper">
                            <div className="schedule-grid" 
                                 style={{
                                     gridTemplateColumns: `120px repeat(${timeSlots.length}, minmax(35px, 50px))`
                                 }}>
                                
                                {/* Corner spacer */}
                                <div className="corner-spacer">Time</div>
                                
                                {/* Time headers */}
                                {timeSlots.map(timeSlot => (
                                    <div key={timeSlot} className={`time-header ${timeSlot.endsWith(':00') ? 'hour-boundary' : ''}`}>
                                        <div className="time-24">{timeSlot}</div>
                                        <div className="time-12">{formatTimeDisplay(timeSlot)}</div>
                                    </div>
                                ))}
                                
                                {/* Day rows */}
                                {displayDays.map(day => (
                                    <React.Fragment key={day}>
                                        <div className="day-label">
                                            <div className="day-name">{day}</div>
                                            <div className="day-summary">
                                                {processedScheduleData[day]?.length || 0} event(s)
                                            </div>
                                        </div>
                                        
                                        {timeSlots.map(timeSlot => {
                                            const status = getSlotStatus(day, timeSlot);
                                            const dayData = processedScheduleData[day] || [];
                                            const activeRange = dayData.find(range => 
                                                getTimeSlotStatus({ [day]: { timeRanges: [range] } }, day, timeSlot) === status && status !== 'free'
                                            );
                                            
                                            return (
                                                <div 
                                                    key={`${day}-${timeSlot}`} 
                                                    className={`time-slot ${status}`}
                                                    title={`${day} ${formatTimeDisplay(timeSlot)} - ${status.replace('-', ' ')}${activeRange ? `: ${activeRange.title || 'Busy'}` : ''}`}
                                                >
                                                    {activeRange && activeRange.title && (
                                                        <div className="slot-content">
                                                            <div className="event-title">{activeRange.title}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default WeeklyView;