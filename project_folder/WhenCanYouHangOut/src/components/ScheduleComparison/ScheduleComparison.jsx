import React, { useState } from 'react';
import '../../css/ScheduleComparison.css';
import '../../css/global.css';

const ScheduleComparison = ({ schedules }) => {
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    const handleScheduleToggle = (scheduleId) => {
        setSelectedSchedules(prev => {
            if (prev.includes(scheduleId)) {
                return prev.filter(id => id !== scheduleId);
            }
            return [...prev, scheduleId];
        });
    };

    const getOverlappingStatus = (day, hour) => {
        if (selectedSchedules.length === 0) return 'free';
        
        // For single schedule, directly map the status
        if (selectedSchedules.length === 1) {
            const schedule = schedules[selectedSchedules[0]];
            if (!schedule || !schedule.schedule[day]) return 'free';

            const timeRanges = schedule.schedule[day].timeRanges;
            if (!timeRanges || timeRanges.length === 0) return 'free';
            
            const [currentHour] = hour.split(':').map(Number);
            
            for (const range of timeRanges) {
                const [startHour] = range.start.split(':').map(Number);
                const [endHour] = range.end.split(':').map(Number);

                if (currentHour >= startHour && currentHour < endHour) {
                    const status = range.status.toLowerCase().replace(' ', '-');
                    return status === 'free' ? 'all-free' : 
                           status === 'maybe-free' ? 'some-free' : 'none-free';
                }
            }
            return 'all-free';
        }

        // Multiple schedules comparison
        const statuses = selectedSchedules.map(scheduleId => {
            const schedule = schedules[scheduleId];
            if (!schedule || !schedule.schedule[day]) return 'free';

            const timeRanges = schedule.schedule[day].timeRanges;
            if (!timeRanges || timeRanges.length === 0) return 'free';
            
            const [currentHour] = hour.split(':').map(Number);
            
            for (const range of timeRanges) {
                const [startHour] = range.start.split(':').map(Number);
                const [endHour] = range.end.split(':').map(Number);

                if (currentHour >= startHour && currentHour < endHour) {
                    return range.status.toLowerCase().replace(' ', '-');
                }
            }
            return 'free';
        });

        const freeCount = statuses.filter(s => s === 'free').length;
        
        if (freeCount === statuses.length) return 'all-free';
        if (freeCount > 0) return 'some-free';
        return 'none-free';
    };

    return (
        <div className="schedule-comparison">
            <h1 className="page-header">Compare Schedules</h1>
            <div className="comparison-content">
                <div className="schedule-selector">
                    <h3>Select Schedules to Compare</h3>
                    <div className="schedule-checkboxes">
                        {Object.entries(schedules).map(([id, schedule]) => (
                            <label key={id} className="schedule-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedSchedules.includes(id)}
                                    onChange={() => handleScheduleToggle(id)}
                                />
                                {schedule.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="comparison-grid">
                    <div className="time-labels">
                        <div className="corner-spacer"></div>
                        {timeSlots.map(time => (
                            <div key={time} className="time-label">{time}</div>
                        ))}
                    </div>
                    {days.map(day => (
                        <div key={day} className="day-row">
                            <div className="day-label">{day}</div>
                            {timeSlots.map(time => (
                                <div 
                                    key={`${day}-${time}`} 
                                    className={`time-slot ${getOverlappingStatus(day, time)}`}
                                    title={`${day} ${time}`}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-color all-free"></div>
                        <span>Everyone Free</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color some-free"></div>
                        <span>Some Free</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color none-free"></div>
                        <span>No One Free</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleComparison;