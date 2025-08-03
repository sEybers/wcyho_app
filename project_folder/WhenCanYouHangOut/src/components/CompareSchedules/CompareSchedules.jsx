import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../../services/api.js';
import { 
    findScheduleConflicts, 
    findCommonFreeTime, 
    getTimeSlotStatus,
    formatTimeDisplay,
    generateTimeSlots,
    DAYS_OF_WEEK 
} from '../../utils/timeUtils.js';
import '../../css/CompareSchedules.css';

const CompareSchedules = () => {
    // State management
    const [userSchedules, setUserSchedules] = useState({});
    const [friendsSchedules, setFriendsSchedules] = useState({});
    const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('conflicts'); // 'conflicts', 'grid', 'free-time'
    const [comparisonSettings, setComparisonSettings] = useState({
        showWeekends: true,
        startHour: 0,
        endHour: 24,
        minFreeTimeMinutes: 60
    });
    // Memoized computed values
    const allSchedules = useMemo(() => ({
        ...userSchedules,
        ...friendsSchedules
    }), [userSchedules, friendsSchedules]);

    const selectedSchedules = useMemo(() => {
        return selectedScheduleIds
            .map(id => allSchedules[id])
            .filter(Boolean)
            .map(schedule => ({
                id: schedule.id,
                name: schedule.name,
                schedule: schedule.schedule,
                ownerName: schedule.ownerName || schedule.name,
                ownerType: schedule.ownerType || 'user'
            }));
    }, [selectedScheduleIds, allSchedules]);

    const timeSlots = useMemo(() => {
        return generateTimeSlots(
            comparisonSettings.startHour, 
            comparisonSettings.endHour, 
            30 // 30-minute intervals for better granularity
        );
    }, [comparisonSettings.startHour, comparisonSettings.endHour]);

    const displayDays = useMemo(() => {
        return comparisonSettings.showWeekends 
            ? DAYS_OF_WEEK 
            : DAYS_OF_WEEK.slice(1, 6);
    }, [comparisonSettings.showWeekends]);

    // Conflict analysis
    const conflictAnalysis = useMemo(() => {
        if (selectedSchedules.length < 2) return null;
        
        const conflicts = findScheduleConflicts(selectedSchedules);
        const totalConflicts = conflicts.reduce((sum, day) => sum + day.conflicts.length, 0);
        
        return {
            conflicts,
            totalConflicts,
            conflictDays: conflicts.length,
            hasConflicts: totalConflicts > 0
        };
    }, [selectedSchedules]);

    // Free time analysis
    const freeTimeAnalysis = useMemo(() => {
        if (selectedSchedules.length < 2) return {};
        
        const freeTimeByDay = {};
        displayDays.forEach(day => {
            freeTimeByDay[day] = findCommonFreeTime(
                selectedSchedules, 
                day, 
                comparisonSettings.minFreeTimeMinutes
            );
        });
        
        return freeTimeByDay;
    }, [selectedSchedules, displayDays, comparisonSettings.minFreeTimeMinutes]);

    // Load schedules
    useEffect(() => {
        const loadSchedules = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Load user's schedules
                const schedulesData = await apiService.getSchedules();
                const userSchedulesObj = {};
                if (Array.isArray(schedulesData)) {
                    schedulesData.forEach(schedule => {
                        const scheduleId = schedule._id || schedule.id;
                        userSchedulesObj[scheduleId] = {
                            ...schedule,
                            id: scheduleId,
                            ownerType: 'user',
                            ownerName: 'My Schedule'
                        };
                    });
                }
                
                // Load friends' schedules
                const friendsData = await apiService.getFriendsWithSchedules();
                const friendsSchedulesObj = {};
                if (Array.isArray(friendsData)) {
                    friendsData.forEach(friend => {
                        if (friend.primarySchedule) {
                            const friendId = friend._id || friend.id;
                            const scheduleId = friend.primarySchedule._id || friend.primarySchedule.id;
                            const friendScheduleId = `friend-${friendId}-${scheduleId}`;
                            friendsSchedulesObj[friendScheduleId] = {
                                id: friendScheduleId,
                                name: `${friend.username}'s Schedule`,
                                schedule: friend.primarySchedule.schedule,
                                ownerType: 'friend',
                                ownerName: friend.username,
                                friendId: friendId
                            };
                        }
                    });
                }
                
                setUserSchedules(userSchedulesObj);
                setFriendsSchedules(friendsSchedulesObj);
                
                // Auto-select first two schedules
                const allIds = [...Object.keys(userSchedulesObj), ...Object.keys(friendsSchedulesObj)];
                if (allIds.length >= 2) {
                    setSelectedScheduleIds([allIds[0], allIds[1]]);
                } else if (allIds.length === 1) {
                    setSelectedScheduleIds([allIds[0]]);
                }
            } catch (error) {
                console.error('Error loading schedules:', error);
                setError('Failed to load schedules. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadSchedules();
    }, []);

    // Event handlers
    const toggleScheduleSelection = useCallback((scheduleId) => {
        setSelectedScheduleIds(prev => {
            if (prev.includes(scheduleId)) {
                return prev.filter(id => id !== scheduleId);
            } else if (prev.length < 5) { // Limit to 5 schedules for performance
                return [...prev, scheduleId];
            }
            return prev;
        });
    }, []);

    const handleSettingsChange = useCallback((setting, value) => {
        setComparisonSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    }, []);

    // Grid status calculation
    const getGridCellStatus = useCallback((day, timeSlot) => {
        if (selectedSchedules.length < 2) return 'no-comparison';
        
        const statuses = selectedSchedules.map(schedule => 
            getTimeSlotStatus(schedule.schedule, day, timeSlot)
        );
        
        const freeCount = statuses.filter(s => s === 'free').length;
        const notFreeCount = statuses.filter(s => s === 'not-free').length;
        const maybeFreeCount = statuses.filter(s => s === 'maybe-free').length;
        
        // All free - perfect time to hang out
        if (freeCount === selectedSchedules.length) {
            return 'all-free';
        }
        // All busy - major conflict
        if (notFreeCount === selectedSchedules.length) {
            return 'all-busy';
        }
        // Mix of free and maybe
        if (freeCount + maybeFreeCount === selectedSchedules.length && maybeFreeCount > 0) {
            return 'maybe-available';
        }
        // Some free, some busy
        if (freeCount > 0 && notFreeCount > 0) {
            return 'partial-conflict';
        }
        
        return 'mixed';
    }, [selectedSchedules]);

    return (
        <div className="compare-schedules">
            <header className="compare-header">
                <h2>Schedule Comparison</h2>
                <p>Compare multiple schedules to find conflicts and optimal meeting times</p>
            </header>
            
            {/* Loading state */}
            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading schedules...</p>
                </div>
            )}
            
            {/* Error state */}
            {error && (
                <div className="error-banner">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <div className="error-text">
                            <strong>Error:</strong> {error}
                        </div>
                        <button 
                            className="error-dismiss" 
                            onClick={() => setError(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            
            {/* Insufficient schedules */}
            {!loading && (Object.keys(userSchedules).length + Object.keys(friendsSchedules).length < 2) && (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Need More Schedules</h3>
                    <p>You need at least 2 schedules to compare them.</p>
                    <p>Create more schedules or add friends with schedules.</p>
                </div>
            )}
            
            {/* Main comparison interface */}
            {!loading && (Object.keys(userSchedules).length + Object.keys(friendsSchedules).length >= 2) && (
                <div className="comparison-content">
                    {/* Settings and Controls */}
                    <div className="controls-section">
                        {/* Schedule Selection */}
                        <div className="schedule-selectors">
                            <h3>Select Schedules to Compare</h3>
                            <div className="selection-info">
                                <span className="selection-count">
                                    {selectedScheduleIds.length} of {Object.keys(allSchedules).length} schedules selected
                                </span>
                                {selectedSchedules.length >= 2 && (
                                    <span className="ready-indicator">✓ Ready to compare</span>
                                )}
                                {selectedSchedules.length >= 5 && (
                                    <span className="limit-warning">Maximum 5 schedules</span>
                                )}
                            </div>
                            
                            <div className="schedule-categories">
                                {Object.keys(userSchedules).length > 0 && (
                                    <div className="schedule-category">
                                        <h4>My Schedules</h4>
                                        <div className="schedule-checkboxes">
                                            {Object.entries(userSchedules).map(([id, schedule]) => (
                                                <label key={id} className="schedule-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedScheduleIds.includes(id)}
                                                        onChange={() => toggleScheduleSelection(id)}
                                                        disabled={!selectedScheduleIds.includes(id) && selectedScheduleIds.length >= 5}
                                                    />
                                                    <span className="checkbox-label">
                                                        {schedule.name || `Schedule ${id.slice(-4)}`}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {Object.keys(friendsSchedules).length > 0 && (
                                    <div className="schedule-category">
                                        <h4>Friends' Schedules</h4>
                                        <div className="schedule-checkboxes">
                                            {Object.entries(friendsSchedules).map(([id, schedule]) => (
                                                <label key={id} className="schedule-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedScheduleIds.includes(id)}
                                                        onChange={() => toggleScheduleSelection(id)}
                                                        disabled={!selectedScheduleIds.includes(id) && selectedScheduleIds.length >= 5}
                                                    />
                                                    <span className="checkbox-label">{schedule.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comparison Settings */}
                        {selectedSchedules.length >= 2 && (
                            <div className="comparison-settings">
                                <h4>Comparison Settings</h4>
                                <div className="settings-grid">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={comparisonSettings.showWeekends}
                                            onChange={(e) => handleSettingsChange('showWeekends', e.target.checked)}
                                        />
                                        Include Weekends
                                    </label>
                                    
                                    <div className="time-range-controls">
                                        <label>
                                            Start Time:
                                            <select
                                                value={comparisonSettings.startHour}
                                                onChange={(e) => handleSettingsChange('startHour', parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {formatTimeDisplay(`${i.toString().padStart(2, '0')}:00`)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        
                                        <label>
                                            End Time:
                                            <select
                                                value={comparisonSettings.endHour}
                                                onChange={(e) => handleSettingsChange('endHour', parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                                    <option key={hour} value={hour}>
                                                        {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    
                                    <label>
                                        Minimum free time:
                                        <select
                                            value={comparisonSettings.minFreeTimeMinutes}
                                            onChange={(e) => handleSettingsChange('minFreeTimeMinutes', parseInt(e.target.value))}
                                        >
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={90}>1.5 hours</option>
                                            <option value={120}>2 hours</option>
                                            <option value={180}>3 hours</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comparison Results */}
                    {selectedSchedules.length >= 2 && (
                        <>
                            {/* View Mode Toggle */}
                            <div className="view-mode-toggle">
                                <button 
                                    className={`toggle-btn ${viewMode === 'conflicts' ? 'active' : ''}`}
                                    onClick={() => setViewMode('conflicts')}
                                >
                                    📋 Conflicts
                                </button>
                                <button 
                                    className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    📅 Grid View
                                </button>
                                <button 
                                    className={`toggle-btn ${viewMode === 'free-time' ? 'active' : ''}`}
                                    onClick={() => setViewMode('free-time')}
                                >
                                    ⏰ Free Time
                                </button>
                            </div>

                            {/* Comparison Summary */}
                            <div className="comparison-summary">
                                <h3>Comparing {selectedSchedules.length} Schedules</h3>
                                <div className="selected-schedules">
                                    {selectedSchedules.map(schedule => (
                                        <span key={schedule.id} className={`schedule-badge ${schedule.ownerType}`}>
                                            {schedule.name}
                                        </span>
                                    ))}
                                </div>
                                
                                {conflictAnalysis && (
                                    <div className="analysis-summary">
                                        {conflictAnalysis.hasConflicts ? (
                                            <div className="conflict-stats">
                                                <span className="stat conflict">
                                                    {conflictAnalysis.totalConflicts} conflicts found
                                                </span>
                                                <span className="stat">
                                                    across {conflictAnalysis.conflictDays} days
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="no-conflicts-stat">
                                                ✅ No scheduling conflicts detected!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Conflicts View */}
                            {viewMode === 'conflicts' && conflictAnalysis && (
                                <div className="conflicts-view">
                                    {conflictAnalysis.hasConflicts ? (
                                        <div className="conflicts-list">
                                            <h4>Schedule Conflicts</h4>
                                            {conflictAnalysis.conflicts.map(({ day, conflicts }) => (
                                                <div key={day} className="day-conflicts">
                                                    <h5>{day}</h5>
                                                    <div className="conflicts-grid">
                                                        {conflicts.map((conflict, index) => (
                                                            <div key={index} className="conflict-card">
                                                                <div className="conflict-time">
                                                                    {formatTimeDisplay(conflict.overlapStart)} - {formatTimeDisplay(conflict.overlapEnd)}
                                                                </div>
                                                                <div className="conflicting-events">
                                                                    <div className="event">
                                                                        <strong>{conflict.range1.ownerName}</strong>
                                                                        <div className="event-details">
                                                                            {conflict.range1.title || 'Busy'}
                                                                            <span className={`status ${conflict.range1.status}`}>
                                                                                {conflict.range1.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="vs">vs</div>
                                                                    <div className="event">
                                                                        <strong>{conflict.range2.ownerName}</strong>
                                                                        <div className="event-details">
                                                                            {conflict.range2.title || 'Busy'}
                                                                            <span className={`status ${conflict.range2.status}`}>
                                                                                {conflict.range2.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-conflicts-message">
                                            <div className="success-icon">🎉</div>
                                            <h4>No Conflicts Found!</h4>
                                            <p>All selected schedules are compatible with each other.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className="grid-view">
                                    <div className="grid-legend">
                                        <h4>Weekly Comparison Grid</h4>
                                        <div className="legend-items">
                                            <div className="legend-item">
                                                <div className="legend-color all-free"></div>
                                                <span>All Free (Perfect time!)</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color maybe-available"></div>
                                                <span>Maybe Available</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color partial-conflict"></div>
                                                <span>Partial Conflict</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color all-busy"></div>
                                                <span>All Busy</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color mixed"></div>
                                                <span>Mixed Status</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid-view-container">
                                        <div 
                                            className="comparison-grid"
                                            style={{
                                                '--time-slots-count': timeSlots.length
                                            }}
                                        >
                                            <div className="corner-spacer">Time</div>
                                            
                                            {timeSlots.map((timeSlot, index) => (
                                                <div key={timeSlot} className={`time-header ${timeSlot.endsWith(':00') ? 'hour-boundary' : ''}`}>
                                                    <div className="time-24">{timeSlot}</div>
                                                    <div className="time-12">{formatTimeDisplay(timeSlot)}</div>
                                                </div>
                                            ))}
                                            
                                            {displayDays.map(day => (
                                                <React.Fragment key={day}>
                                                    <div className="day-label">{day}</div>
                                                    {timeSlots.map(timeSlot => {
                                                        const status = getGridCellStatus(day, timeSlot);
                                                        return (
                                                            <div 
                                                                key={`${day}-${timeSlot}`}
                                                                className={`grid-cell ${status}`}
                                                                title={`${day} ${formatTimeDisplay(timeSlot)} - ${status.replace('-', ' ')}`}
                                                            />
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="grid-info">
                                        <p>
                                            📋 This grid shows availability comparison across all selected schedules in 30-minute intervals for the full 24-hour day.
                                            Hover over any cell to see detailed status information. Scroll horizontally to view all time slots.
                                        </p>
                                        <p>
                                            <strong>Full Day View:</strong> 00:00 - 24:00 ({timeSlots.length} time slots) | 
                                            <strong> Days:</strong> {comparisonSettings.showWeekends ? '7 days (including weekends)' : '5 weekdays only'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Free Time View */}
                            {viewMode === 'free-time' && (
                                <div className="free-time-view">
                                    <h4>Common Free Time</h4>
                                    <p>Times when all selected people are available</p>
                                    
                                    <div className="free-time-grid">
                                        {displayDays.map(day => {
                                            const dayFreeTime = freeTimeAnalysis[day] || [];
                                            return (
                                                <div key={day} className="day-free-time">
                                                    <h5>{day}</h5>
                                                    {dayFreeTime.length > 0 ? (
                                                        <div className="free-slots">
                                                            {dayFreeTime.map((slot, index) => (
                                                                <div key={index} className="free-slot">
                                                                    <div className="time-range">
                                                                        {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
                                                                    </div>
                                                                    <div className="duration">
                                                                        {Math.floor(slot.duration / 60)}h {slot.duration % 60}m
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="no-free-time">
                                                            No common free time of {comparisonSettings.minFreeTimeMinutes} minutes or more
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {selectedSchedules.length < 2 && (
                        <div className="selection-prompt">
                            <h4>Select at least 2 schedules to begin comparison</h4>
                            <p>Choose schedules from the list above to see conflicts, grid view, and common free time.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CompareSchedules;