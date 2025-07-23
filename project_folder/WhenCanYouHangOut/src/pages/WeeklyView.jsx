import React from 'react';
import WeeklyCalendar from '../components/WeeklyCalendar/WeeklyCalendar';
import '../css/WeeklyView.css';

function WeeklyView({ schedule, scheduleName, schedules, activeScheduleId, setActiveScheduleId }) {
    return (
        <div className="weekly-view-container">
            <div className="schedule-selector">
                <h1>Weekly Schedule</h1>
                <select 
                    value={activeScheduleId}
                    onChange={(e) => setActiveScheduleId(e.target.value)}
                    className="schedule-select"
                >
                    {Object.entries(schedules).map(([id, { name }]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>
            </div>
            <div className="calendar-wrapper">
                <WeeklyCalendar schedule={schedule} />
            </div>
        </div>
    );
}

export default WeeklyView;