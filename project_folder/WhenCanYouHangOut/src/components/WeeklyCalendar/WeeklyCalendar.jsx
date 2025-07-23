import React from 'react';
import '../../css/WeeklyCalendar.css'; // Ensure you have the appropriate CSS for styling

const WeeklyCalendar = ({ schedule }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getTimeRangePosition = (timeRange) => {
        const [startHour, startMinute] = timeRange.start.split(':').map(Number);
        const [endHour, endMinute] = timeRange.end.split(':').map(Number);
        
        const startPosition = startHour + startMinute / 60;
        const endPosition = endHour + endMinute / 60;
        const duration = endPosition - startPosition;
        
        return {
            top: `${startPosition * 60}px`,
            height: `${duration * 60}px`
        };
    };

    const formatHour = (hour) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}${period}`;
    };

    return (
        <div className="weekly-calendar">
            <div className="time-labels">
                <div className="corner-spacer"></div>
                {hours.map(hour => (
                    <div key={hour} className="hour-label">
                        {formatHour(hour)}
                    </div>
                ))}
            </div>
            
            <div className="calendar-grid">
                {days.map(day => (
                    <div key={day} className="day-column">
                        <div className="day-header">{day}</div>
                        <div className="day-events">
                            {hours.map(hour => (
                                <div key={hour} className="hour-cell"></div>
                            ))}
                            {schedule[day].timeRanges.map(timeRange => (
                                <div
                                    key={timeRange.id}
                                    className={`event-block ${timeRange.status.toLowerCase().replace(' ', '-')}`}
                                    style={getTimeRangePosition(timeRange)}
                                >
                                    <div className="event-content">
                                        <div className="event-title">{timeRange.title}</div>
                                        <div className="event-time">
                                            {timeRange.start} - {timeRange.end}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeeklyCalendar;