import React from 'react';
import '../../css/HourlySchedule.css';

const HourlySchedule = ({ schedule, className = '' }) => {
    const hours = Array.from({ length: 24 }, (_, i) => 
        `${i.toString().padStart(2, '0')}:00`
    );
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getStatusForHour = (day, hour) => {
        // Returns 'free' if no schedule exists
        if (!schedule || !schedule[day]) return 'free';

        const timeRanges = schedule[day].timeRanges;
        const currentHour = parseInt(hour);

        // Returns 'free' if no time ranges exist
        if (!timeRanges || timeRanges.length === 0) return 'free';

        // Check scheduled ranges
        for (const range of timeRanges) {
            const [startHour] = range.start.split(':').map(Number);
            const [endHour] = range.end.split(':').map(Number);

            if (currentHour >= startHour && currentHour < endHour) {
                return range.status.toLowerCase().replace(' ', '-');
            }
        }

        // Returns 'free' if hour isn't in any scheduled range
        return 'free';
    };

    return (
        <div className={`hourly-schedule-wrapper ${className}`}>
            <div className="time-labels">
                {hours.map(hour => (
                    <div key={hour} className="time-label">{hour}</div>
                ))}
            </div>
            <div className="hourly-schedule">
                {days.map(day => (
                    <div key={day} className="day-column">
                        <div className="day-label">{day}</div>
                        {hours.map(hour => (
                            <div 
                                key={`${day}-${hour}`} 
                                className={`hour-cell ${getStatusForHour(day, hour)}`}
                                title={`${day} ${hour}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HourlySchedule;