import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api.js';
import '../../css/CompareSchedules.css';

const CompareSchedules = () => {
    // State for managing all schedules and selected schedules for comparison
    const [schedules, setSchedules] = useState({});
    const [friendsSchedules, setFriendsSchedules] = useState({});
    const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('weekly'); // 'conflicts' or 'weekly'
    
    // Load schedules when component mounts
    useEffect(() => {
        const loadSchedules = async () => {
            try {
                setLoading(true);
                
                // Load user's schedules
                const schedulesData = await apiService.getSchedules();
                const schedulesObj = {};
                if (Array.isArray(schedulesData)) {
                    schedulesData.forEach(schedule => {
                        schedulesObj[schedule.id] = {
                            ...schedule,
                            ownerType: 'user',
                            ownerName: 'My Schedule'
                        };
                    });
                }
                
                // Load friends' primary schedules
                const friendsData = await apiService.getFriendsWithSchedules();
                const friendsSchedulesObj = {};
                if (Array.isArray(friendsData)) {
                    friendsData.forEach(friend => {
                        if (friend.primarySchedule) {
                            const friendScheduleId = `friend-${friend.id}-${friend.primarySchedule.id || friend.primarySchedule._id}`;
                            friendsSchedulesObj[friendScheduleId] = {
                                id: friendScheduleId,
                                name: `${friend.username}'s Schedule`,
                                schedule: friend.primarySchedule.schedule,
                                ownerType: 'friend',
                                ownerName: friend.username,
                                friendId: friend.id
                            };
                        }
                    });
                }
                
                setSchedules(schedulesObj);
                setFriendsSchedules(friendsSchedulesObj);
                
                // Combine all schedules for selection
                const allSchedules = { ...schedulesObj, ...friendsSchedulesObj };
                
                // Pre-select first two schedules if available
                const scheduleIds = Object.keys(allSchedules);
                if (scheduleIds.length >= 2) {
                    setSelectedScheduleIds([scheduleIds[0], scheduleIds[1]]);
                } else if (scheduleIds.length === 1) {
                    setSelectedScheduleIds([scheduleIds[0]]);
                }
            } catch (error) {
                console.error('Error loading schedules:', error);
                setError('Failed to load schedules');
            } finally {
                setLoading(false);
            }
        };

        loadSchedules();
    }, []);
    
    const toggleScheduleSelection = (scheduleId) => {
        setSelectedScheduleIds(prev => {
            if (prev.includes(scheduleId)) {
                return prev.filter(id => id !== scheduleId);
            } else {
                return [...prev, scheduleId];
            }
        });
    };

    const findConflicts = () => {
        if (selectedScheduleIds.length < 2) return [];
        
        const allSchedules = { ...schedules, ...friendsSchedules };
        const selectedSchedules = selectedScheduleIds.map(id => ({
            id,
            name: allSchedules[id].name,
            schedule: allSchedules[id].schedule,
            ownerName: allSchedules[id].ownerName
        }));
        
        const conflicts = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        days.forEach(day => {
            const dayConflicts = [];
            
            // Check each hour for conflicts across all schedules
            for (let hour = 0; hour < 24; hour++) {
                const hourString = `${hour.toString().padStart(2, '0')}:00`;
                const schedulesAtThisHour = [];
                
                selectedSchedules.forEach(({ id, name, schedule, ownerName }) => {
                    const status = getStatusForHour(schedule, day, hourString);
                    if (status !== 'free') {
                        const timeRanges = schedule[day]?.timeRanges || [];
                        const activeRange = timeRanges.find(range => {
                            const [startHour] = range.start.split(':').map(Number);
                            const [endHour] = range.end.split(':').map(Number);
                            return hour >= startHour && hour < endHour;
                        });
                        
                        if (activeRange) {
                            schedulesAtThisHour.push({
                                scheduleId: id,
                                scheduleName: name,
                                ownerName: ownerName,
                                range: activeRange,
                                hour: hourString
                            });
                        }
                    }
                });
                
                // If multiple schedules have events at this hour, it's a conflict
                if (schedulesAtThisHour.length >= 2) {
                    dayConflicts.push({
                        hour: hourString,
                        conflictingSchedules: schedulesAtThisHour
                    });
                }
            }
            
            if (dayConflicts.length > 0) {
                conflicts.push({ day, conflicts: dayConflicts });
            }
        });

        return conflicts;
    };

    const hasOverlap = (range1, range2) => {
        const [start1Hours, start1Minutes] = range1.start.split(':').map(Number);
        const [end1Hours, end1Minutes] = range1.end.split(':').map(Number);
        const [start2Hours, start2Minutes] = range2.start.split(':').map(Number);
        const [end2Hours, end2Minutes] = range2.end.split(':').map(Number);

        const start1 = start1Hours * 60 + start1Minutes;
        const end1 = end1Hours * 60 + end1Minutes;
        const start2 = start2Hours * 60 + start2Minutes;
        const end2 = end2Hours * 60 + end2Minutes;

        return (start1 < end2 && end1 > start2);
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour = hours % 12 || 12;
        return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Weekly view helper functions
    const hours = Array.from({ length: 24 }, (_, i) => 
        `${i.toString().padStart(2, '0')}:00`
    );
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getStatusForHour = (schedule, day, hour) => {
        if (!schedule || !schedule[day]) return 'free';

        const timeRanges = schedule[day].timeRanges;
        const currentHour = parseInt(hour);

        if (!timeRanges || timeRanges.length === 0) return 'free';

        for (const range of timeRanges) {
            const [startHour] = range.start.split(':').map(Number);
            const [endHour] = range.end.split(':').map(Number);

            if (currentHour >= startHour && currentHour < endHour) {
                return range.status.toLowerCase().replace(' ', '-');
            }
        }

        return 'free';
    };

    const getConflictStatusForHour = (day, hour) => {
        if (selectedScheduleIds.length < 2) {
            return 'no-comparison';
        }

        const allSchedules = { ...schedules, ...friendsSchedules };
        const statuses = selectedScheduleIds.map(scheduleId => {
            if (!allSchedules[scheduleId]) return 'free';
            return getStatusForHour(allSchedules[scheduleId].schedule, day, hour);
        });

        const freeCount = statuses.filter(s => s === 'free').length;
        const notFreeCount = statuses.filter(s => s === 'not-free').length;
        const maybeFreeCount = statuses.filter(s => s === 'maybe-free').length;

        // All schedules are free - ideal hangout time
        if (freeCount === selectedScheduleIds.length) {
            return 'all-free';
        }
        // All schedules are busy - major conflict
        if (notFreeCount === selectedScheduleIds.length) {
            return 'all-busy';
        }
        // Mix of free and maybe-free
        if (freeCount + maybeFreeCount === selectedScheduleIds.length && maybeFreeCount > 0) {
            return 'maybe-available';
        }
        // Some free, some busy
        if (freeCount > 0 && notFreeCount > 0) {
            return 'partial-conflict';
        }
        
        return 'mixed';
    };

    const conflicts = findConflicts();

    return (
        <div className="compare-schedules">
            <h2>Compare Schedules</h2>
            
            {/* Loading state */}
            {loading && (
                <div className="loading">
                    <p>Loading schedules...</p>
                </div>
            )}
            
            {/* Error state */}
            {error && (
                <div className="error">
                    <p>Error: {error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
            
            {/* No schedules message */}
            {!loading && (!schedules || (Object.keys(schedules).length + Object.keys(friendsSchedules).length < 2)) && (
                <div className="no-schedules">
                    <p>You need at least 2 schedules to compare them. Please create more schedules or add friends with schedules.</p>
                </div>
            )}
            
            {/* Compare interface */}
            {!loading && (Object.keys(schedules).length + Object.keys(friendsSchedules).length >= 2) && (
                <>
                    <div className="schedule-selectors">
                        <div className="multi-select-container">
                            <label>Select Schedules to Compare (select multiple):</label>
                            <div className="schedule-categories">
                                {Object.keys(schedules).length > 0 && (
                                    <div className="schedule-category">
                                        <h3>My Schedules</h3>
                                        <div className="schedule-checkboxes">
                                            {Object.entries(schedules).map(([id, schedule]) => (
                                                <div key={id} className="schedule-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        id={`schedule-${id}`}
                                                        checked={selectedScheduleIds.includes(id)}
                                                        onChange={() => toggleScheduleSelection(id)}
                                                    />
                                                    <label htmlFor={`schedule-${id}`}>{schedule.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {Object.keys(friendsSchedules).length > 0 && (
                                    <div className="schedule-category">
                                        <h3>Friends' Schedules</h3>
                                        <div className="schedule-checkboxes">
                                            {Object.entries(friendsSchedules).map(([id, schedule]) => (
                                                <div key={id} className="schedule-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        id={`schedule-${id}`}
                                                        checked={selectedScheduleIds.includes(id)}
                                                        onChange={() => toggleScheduleSelection(id)}
                                                    />
                                                    <label htmlFor={`schedule-${id}`}>{schedule.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="selection-summary">
                                {selectedScheduleIds.length} schedule(s) selected
                                {selectedScheduleIds.length >= 2 && (
                                    <span className="ready-indicator"> ✓ Ready to compare</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    {selectedScheduleIds.length >= 2 && (
                        <div className="view-mode-toggle">
                            <button 
                                className={`toggle-btn ${viewMode === 'conflicts' ? 'active' : ''}`}
                                onClick={() => setViewMode('conflicts')}
                            >
                                Conflicts List
                            </button>
                            <button 
                                className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                                onClick={() => setViewMode('weekly')}
                            >
                                Weekly Grid
                            </button>
                        </div>
                    )}

                    {/* Conflicts List View */}
                    {viewMode === 'conflicts' && conflicts.length > 0 ? (
                        <div className="conflicts-list">
                            <h3>Schedule Conflicts Found:</h3>
                            <div className="selected-schedules-info">
                                <h4>Comparing {selectedScheduleIds.length} schedules:</h4>
                                <div className="schedule-names">
                                    {selectedScheduleIds.map((id, index) => {
                                        const allSchedules = { ...schedules, ...friendsSchedules };
                                        const schedule = allSchedules[id];
                                        return (
                                            <span key={id} className="schedule-name">
                                                {schedule?.name}
                                                {index < selectedScheduleIds.length - 1 && ', '}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            {conflicts.map(({ day, conflicts }) => (
                                <div key={day} className="day-conflicts">
                                    <h4>{day}</h4>
                                    {conflicts.map((conflict, index) => (
                                        <div key={index} className="conflict-item">
                                            <div className="conflict-time-header">
                                                <strong>Conflict at {conflict.hour}</strong>
                                            </div>
                                            <div className="conflicting-schedules">
                                                {conflict.conflictingSchedules.map((schedule, scheduleIndex) => (
                                                    <div key={schedule.scheduleId} className="schedule-conflict">
                                                        <h5>{schedule.ownerName}</h5>
                                                        <p className="schedule-subtitle">{schedule.scheduleName}</p>
                                                        <p className="conflict-title">{schedule.range.title}</p>
                                                        <p className="conflict-time">{formatTime(schedule.range.start)} - {formatTime(schedule.range.end)}</p>
                                                        <p className={`status ${schedule.range.status.toLowerCase().replace(' ', '-')}`}>
                                                            {schedule.range.status}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : viewMode === 'conflicts' && selectedScheduleIds.length >= 2 ? (
                        <p className="no-conflicts">✅ No conflicts found between the selected schedules!</p>
                    ) : viewMode === 'conflicts' ? (
                        <p className="select-prompt">Select at least 2 schedules to compare and see potential conflicts.</p>
                    ) : null}

                    {/* Weekly Grid View */}
                    {viewMode === 'weekly' && selectedScheduleIds.length >= 2 && (
                        <div className="weekly-comparison-grid">
                            <div className="grid-legend">
                                <h3>Multi-Schedule Comparison Grid</h3>
                                <div className="legend-items">
                                    <div className="legend-item">
                                        <div className="legend-color all-free"></div>
                                        <span>All Free (Perfect for hangouts!)</span>
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
                                        <span>All Busy (Major Conflict)</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color mixed"></div>
                                        <span>Mixed Availability</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="comparison-schedules-info">
                                <div className="multi-schedule-info">
                                    <h4>Comparing {selectedScheduleIds.length} Schedules:</h4>
                                    <div className="schedule-list">
                                        {selectedScheduleIds.map((id, index) => {
                                            const allSchedules = { ...schedules, ...friendsSchedules };
                                            const schedule = allSchedules[id];
                                            return (
                                                <span key={id} className="schedule-badge">
                                                    {schedule?.name}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="weekly-grid">
                                <div className="corner-spacer"></div>
                                {hours.map(hour => (
                                    <div key={hour} className="time-header">{hour}</div>
                                ))}

                                {days.map(day => (
                                    <React.Fragment key={day}>
                                        <div className="day-label">{day}</div>
                                        {hours.map(hour => {
                                            const conflictStatus = getConflictStatusForHour(day, hour);
                                            return (
                                                <div 
                                                    key={`${day}-${hour}`} 
                                                    className={`time-cell ${conflictStatus}`}
                                                    title={`${day} ${hour} - ${conflictStatus.replace('-', ' ')}`}
                                                >
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewMode === 'weekly' && selectedScheduleIds.length < 2 && (
                        <p className="select-prompt">Select at least 2 schedules to compare and see the weekly grid view.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default CompareSchedules;