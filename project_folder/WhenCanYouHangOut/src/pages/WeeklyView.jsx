import React from 'react';
import '../css/WeeklyView.css';

function WeeklyView({ schedule, schedules, activeScheduleId, setActiveScheduleId }) {
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
        </div>
    );
}

export default WeeklyView;