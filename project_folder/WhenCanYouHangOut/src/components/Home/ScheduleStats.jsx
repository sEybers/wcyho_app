import React from 'react';
import { DAYS_OF_WEEK } from '../../utils/timeUtils.js';

/**
 * Schedule Statistics Component
 * Shows comprehensive analytics about the schedule
 */
function ScheduleStats({ stats, scheduleData, schedule }) {
    const getStatusDistribution = () => {
        const distribution = {
            'Free': 0,
            'Not Free': 0,
            'Maybe Free': 0
        };
        
        DAYS_OF_WEEK.forEach(day => {
            const dayRanges = scheduleData[day] || [];
            dayRanges.forEach(range => {
                distribution[range.status] = (distribution[range.status] || 0) + 1;
            });
        });
        
        return distribution;
    };
    
    const getDayAnalysis = () => {
        return DAYS_OF_WEEK.map(day => {
            const dayRanges = scheduleData[day] || [];
            const totalEvents = dayRanges.length;
            
            let totalDuration = 0;
            let freeDuration = 0;
            let busyDuration = 0;
            let maybeDuration = 0;
            
            dayRanges.forEach(range => {
                const startHour = parseInt(range.start.split(':')[0]);
                const startMin = parseInt(range.start.split(':')[1]);
                const endHour = parseInt(range.end.split(':')[0]);
                const endMin = parseInt(range.end.split(':')[1]);
                
                const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                totalDuration += duration;
                
                if (range.status === 'Free') freeDuration += duration;
                else if (range.status === 'Not Free') busyDuration += duration;
                else if (range.status === 'Maybe Free') maybeDuration += duration;
            });
            
            return {
                day,
                totalEvents,
                totalDuration: Math.round(totalDuration / 60 * 10) / 10, // Convert to hours
                freeDuration: Math.round(freeDuration / 60 * 10) / 10,
                busyDuration: Math.round(busyDuration / 60 * 10) / 10,
                maybeDuration: Math.round(maybeDuration / 60 * 10) / 10,
                utilization: totalDuration > 0 ? Math.round((totalDuration / (24 * 60)) * 100) : 0
            };
        });
    };
    
    const getTimePatterns = () => {
        const hourlyActivity = new Array(24).fill(0);
        
        DAYS_OF_WEEK.forEach(day => {
            const dayRanges = scheduleData[day] || [];
            dayRanges.forEach(range => {
                const startHour = parseInt(range.start.split(':')[0]);
                const endHour = parseInt(range.end.split(':')[0]);
                
                for (let hour = startHour; hour < endHour; hour++) {
                    hourlyActivity[hour]++;
                }
            });
        });
        
        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
        const quietHour = hourlyActivity.indexOf(Math.min(...hourlyActivity.filter(x => x >= 0)));
        
        return {
            hourlyActivity,
            peakHour,
            quietHour,
            totalActiveHours: hourlyActivity.filter(x => x > 0).length
        };
    };
    
    const statusDistribution = getStatusDistribution();
    const dayAnalysis = getDayAnalysis();
    const timePatterns = getTimePatterns();
    
    const busiest = dayAnalysis.reduce((max, day) => 
        day.totalEvents > max.totalEvents ? day : max
    );
    
    const quietest = dayAnalysis.reduce((min, day) => 
        day.totalEvents < min.totalEvents ? day : min
    );
    
    const formatHour = (hour) => {
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour12}:00 ${ampm}`;
    };
    
    return (
        <div className="schedule-stats">
            <div className="stats-header">
                <h2>Schedule Statistics</h2>
                <p>Analytics for "{schedule.name}"</p>
            </div>
            
            <div className="stats-grid">
                {/* Overview Cards */}
                <div className="stats-section overview-cards">
                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <h3>{stats.totalEvents}</h3>
                            <p>Total Events</p>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon">⏰</div>
                        <div className="stat-content">
                            <h3>{stats.averageEventsPerDay}</h3>
                            <p>Events per Day</p>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>{stats.freePercentage}%</h3>
                            <p>Free Time</p>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon">🔥</div>
                        <div className="stat-content">
                            <h3>{busiest.day}</h3>
                            <p>Busiest Day</p>
                        </div>
                    </div>
                </div>
                
                {/* Status Distribution */}
                <div className="stats-section">
                    <h3>Availability Distribution</h3>
                    <div className="status-chart">
                        {Object.entries(statusDistribution).map(([status, count]) => {
                            const percentage = stats.totalEvents > 0 ? Math.round((count / stats.totalEvents) * 100) : 0;
                            return (
                                <div key={status} className="status-bar">
                                    <div className="status-info">
                                        <span className={`status-label status-${status.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {status}
                                        </span>
                                        <span className="status-count">{count} events ({percentage}%)</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className={`progress-fill status-${status.replace(/\s+/g, '-').toLowerCase()}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Daily Breakdown */}
                <div className="stats-section">
                    <h3>Daily Breakdown</h3>
                    <div className="daily-stats">
                        {dayAnalysis.map(day => (
                            <div key={day.day} className="day-stat">
                                <div className="day-header">
                                    <span className="day-name">{day.day}</span>
                                    <span className="event-count">{day.totalEvents} events</span>
                                </div>
                                <div className="day-details">
                                    <div className="detail-item">
                                        <span>Total Time:</span>
                                        <span>{day.totalDuration}h</span>
                                    </div>
                                    <div className="detail-item">
                                        <span>Utilization:</span>
                                        <span>{day.utilization}%</span>
                                    </div>
                                </div>
                                <div className="day-breakdown">
                                    <div className="breakdown-bar">
                                        <div 
                                            className="breakdown-segment free"
                                            style={{ 
                                                width: day.totalDuration > 0 ? `${(day.freeDuration / day.totalDuration) * 100}%` : '0%' 
                                            }}
                                            title={`Free: ${day.freeDuration}h`}
                                        ></div>
                                        <div 
                                            className="breakdown-segment busy"
                                            style={{ 
                                                width: day.totalDuration > 0 ? `${(day.busyDuration / day.totalDuration) * 100}%` : '0%' 
                                            }}
                                            title={`Busy: ${day.busyDuration}h`}
                                        ></div>
                                        <div 
                                            className="breakdown-segment maybe"
                                            style={{ 
                                                width: day.totalDuration > 0 ? `${(day.maybeDuration / day.totalDuration) * 100}%` : '0%' 
                                            }}
                                            title={`Maybe: ${day.maybeDuration}h`}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Time Patterns */}
                <div className="stats-section">
                    <h3>Time Patterns</h3>
                    <div className="time-patterns">
                        <div className="pattern-insights">
                            <div className="insight-item">
                                <span className="insight-label">Peak Hour:</span>
                                <span className="insight-value">{formatHour(timePatterns.peakHour)}</span>
                            </div>
                            <div className="insight-item">
                                <span className="insight-label">Quietest Hour:</span>
                                <span className="insight-value">{formatHour(timePatterns.quietHour)}</span>
                            </div>
                            <div className="insight-item">
                                <span className="insight-label">Active Hours:</span>
                                <span className="insight-value">{timePatterns.totalActiveHours}/24</span>
                            </div>
                        </div>
                        
                        <div className="hourly-heatmap">
                            <h4>Activity Heatmap</h4>
                            <div className="heatmap-grid">
                                {timePatterns.hourlyActivity.map((activity, hour) => {
                                    const intensity = Math.max(...timePatterns.hourlyActivity);
                                    const opacity = intensity > 0 ? activity / intensity : 0;
                                    
                                    return (
                                        <div
                                            key={hour}
                                            className="heatmap-cell"
                                            style={{ 
                                                backgroundColor: `rgba(76, 175, 80, ${opacity})`,
                                                opacity: opacity > 0 ? 1 : 0.1
                                            }}
                                            title={`${formatHour(hour)}: ${activity} events`}
                                        >
                                            <span className="hour-label">{hour}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Recommendations */}
                <div className="stats-section">
                    <h3>Insights & Recommendations</h3>
                    <div className="recommendations">
                        {stats.freePercentage < 30 && (
                            <div className="recommendation warning">
                                <span className="rec-icon">⚠️</span>
                                <div>
                                    <strong>Heavy Schedule</strong>
                                    <p>You have very little free time ({stats.freePercentage}%). Consider reviewing your commitments.</p>
                                </div>
                            </div>
                        )}
                        
                        {busiest.totalEvents > quietest.totalEvents + 3 && (
                            <div className="recommendation info">
                                <span className="rec-icon">⚖️</span>
                                <div>
                                    <strong>Unbalanced Week</strong>
                                    <p>{busiest.day} has {busiest.totalEvents} events while {quietest.day} has {quietest.totalEvents}. Consider redistributing tasks.</p>
                                </div>
                            </div>
                        )}
                        
                        {timePatterns.totalActiveHours > 16 && (
                            <div className="recommendation tip">
                                <span className="rec-icon">💡</span>
                                <div>
                                    <strong>Long Days</strong>
                                    <p>You're active for {timePatterns.totalActiveHours} hours daily. Ensure you're getting enough rest.</p>
                                </div>
                            </div>
                        )}
                        
                        {stats.totalEvents === 0 && (
                            <div className="recommendation info">
                                <span className="rec-icon">📝</span>
                                <div>
                                    <strong>Empty Schedule</strong>
                                    <p>Start adding your availability and commitments to help friends coordinate with you.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleStats;
