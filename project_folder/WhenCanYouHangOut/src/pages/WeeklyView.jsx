import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.js';
import '../css/WeeklyView.css';

function WeeklyView() {
    // State for managing all schedules and active schedule
    const [schedules, setSchedules] = useState({});
    const [activeScheduleId, setActiveScheduleId] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Load schedules when component mounts
    useEffect(() => {
        const loadSchedules = async () => {
            try {
                setLoading(true);
                const schedulesData = await apiService.getSchedules();
                
                // Convert array to object with schedule id as key
                const schedulesObj = {};
                if (Array.isArray(schedulesData)) {
                    schedulesData.forEach(schedule => {
                        schedulesObj[schedule.id] = schedule;
                    });
                }
                
                setSchedules(schedulesObj);
                
                // Set active schedule to first one if any exist
                const scheduleIds = Object.keys(schedulesObj);
                if (scheduleIds.length > 0) {
                    const firstId = scheduleIds[0];
                    setActiveScheduleId(firstId);
                    setSchedule(schedulesObj[firstId].schedule);
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

    // Update schedule when active schedule changes
    useEffect(() => {
        if (activeScheduleId && schedules[activeScheduleId]) {
            setSchedule(schedules[activeScheduleId].schedule);
        }
    }, [activeScheduleId, schedules]);
    const hours = Array.from({ length: 24 }, (_, i) => 
        `${i.toString().padStart(2, '0')}:00`
    );
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getStatusForHour = (day, hour) => {
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

    return (
        <div className="weekly-view-container">
            <h1 className="page-header">Weekly Schedule</h1>
            
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
            {!loading && (!schedules || Object.keys(schedules).length === 0) && (
                <div className="no-schedules">
                    <p>No schedules found. Please create a schedule first.</p>
                </div>
            )}
            
            {/* Schedule selector and grid */}
            {!loading && schedules && Object.keys(schedules).length > 0 && (
                <>
                    <div className="schedule-selector">
                        <select 
                            value={activeScheduleId || ''}
                            onChange={(e) => setActiveScheduleId(e.target.value)}
                            className="schedule-select"
                        >
                            {Object.entries(schedules).map(([id, { name }]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Legend */}
                    <div className="schedule-legend">
                        <h3>Schedule Legend</h3>
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
                            <div className="legend-item">
                                <div className="legend-color no-schedule"></div>
                                <span>No Schedule</span>
                            </div>
                        </div>
                    </div>

                    {schedule ? (
                        <div className="schedule-wrapper">
                            <div className="schedule-grid">
                                <div className="corner-spacer"></div>
                                {hours.map(hour => (
                                    <div key={hour} className="time-label">{hour}</div>
                                ))}
                                {days.map(day => (
                                    <React.Fragment key={day}>
                                        <div className="day-label">{day}</div>
                                        {hours.map(hour => (
                                            <div 
                                                key={`${day}-${hour}`} 
                                                className={`time-slot ${getStatusForHour(day, hour)}`}
                                                title={`${day} ${hour}`}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="content-wrapper">
                            <p>Please select a schedule to view</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default WeeklyView;