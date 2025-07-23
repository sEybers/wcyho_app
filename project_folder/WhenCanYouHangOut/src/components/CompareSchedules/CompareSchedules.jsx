import React from 'react';
import '../../css/CompareSchedules.css';

const CompareSchedules = ({ schedules, activeScheduleId }) => {
    const [compareWithId, setCompareWithId] = React.useState('');
    
    const findConflicts = () => {
        if (!compareWithId || !activeScheduleId) return [];
        
        const schedule1 = schedules[activeScheduleId].schedule;
        const schedule2 = schedules[compareWithId].schedule;
        const conflicts = [];

        Object.keys(schedule1).forEach(day => {
            const dayConflicts = [];
            schedule1[day].timeRanges.forEach(range1 => {
                schedule2[day].timeRanges.forEach(range2 => {
                    if (hasOverlap(range1, range2)) {
                        dayConflicts.push({
                            day,
                            schedule1Range: range1,
                            schedule2Range: range2
                        });
                    }
                });
            });
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
        const [hours, minutes] = time.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour = hours % 12 || 12;
        return `${hour}:${minutes} ${period}`;
    };

    const conflicts = findConflicts();

    return (
        <div className="compare-schedules">
            <h2>Compare Schedules</h2>
            <div className="compare-select">
                <select
                    value={compareWithId}
                    onChange={(e) => setCompareWithId(e.target.value)}
                >
                    <option value="">Select a schedule to compare</option>
                    {Object.entries(schedules)
                        .filter(([id]) => id !== activeScheduleId)
                        .map(([id, { name }]) => (
                            <option key={id} value={id}>{name}</option>
                        ))
                    }
                </select>
            </div>

            {conflicts.length > 0 ? (
                <div className="conflicts-list">
                    {conflicts.map(({ day, conflicts }) => (
                        <div key={day} className="day-conflicts">
                            <h3>{day}</h3>
                            {conflicts.map((conflict, index) => (
                                <div key={index} className="conflict-item">
                                    <div className="schedule1-event">
                                        <strong>{schedules[activeScheduleId].name}:</strong>
                                        <p>{conflict.schedule1Range.title}</p>
                                        <p>{formatTime(conflict.schedule1Range.start)} - {formatTime(conflict.schedule1Range.end)}</p>
                                        <p className={`status ${conflict.schedule1Range.status.toLowerCase().replace(' ', '-')}`}>
                                            {conflict.schedule1Range.status}
                                        </p>
                                    </div>
                                    <div className="conflict-divider">conflicts with</div>
                                    <div className="schedule2-event">
                                        <strong>{schedules[compareWithId].name}:</strong>
                                        <p>{conflict.schedule2Range.title}</p>
                                        <p>{formatTime(conflict.schedule2Range.start)} - {formatTime(conflict.schedule2Range.end)}</p>
                                        <p className={`status ${conflict.schedule2Range.status.toLowerCase().replace(' ', '-')}`}>
                                            {conflict.schedule2Range.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : compareWithId ? (
                <p className="no-conflicts">No conflicts found!</p>
            ) : (
                <p className="select-prompt">Select a schedule to see conflicts</p>
            )}
        </div>
    );
};

export default CompareSchedules;