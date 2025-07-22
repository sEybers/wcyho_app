import React from 'react';
import './SleepSchedule.css';

const SleepSchedule = ({ sleepSchedule, handleSleepSchedule, handleRemoveSleepSchedule, formatTime }) => {
    return (
        <div className="sleep-schedule-section">
            <h2>Set Sleep Schedule</h2>
            {!sleepSchedule.enabled ? (
                <form onSubmit={handleSleepSchedule} className='sleep-form'>
                    <div className="time-inputs">
                        <input 
                            type="time"
                            name="sleepStart"
                            required
                            className="time-input"
                            placeholder="Sleep time"
                        />
                        <span>to</span>
                        <input 
                            type="time"
                            name="sleepEnd"
                            required
                            className="time-input"
                            placeholder="Wake time"
                        />
                    </div>
                    <button type="submit" className='add-btn'>
                        Set Sleep Schedule
                    </button>
                </form>
            ) : (
                <div className="active-sleep-schedule">
                    <p>Sleep Schedule: {formatTime(sleepSchedule.start)} - {formatTime(sleepSchedule.end)}</p>
                    <button onClick={handleRemoveSleepSchedule} className="remove-btn">
                        Remove Sleep Schedule
                    </button>
                </div>
            )}
        </div>
    );
};

export default SleepSchedule;