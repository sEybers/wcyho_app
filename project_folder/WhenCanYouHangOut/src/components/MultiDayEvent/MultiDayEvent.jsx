import React from 'react';
import '../../css/MultiDayEvent.css';

const MultiDayEvent = ({ selectedDays, handleMultiDayEvent, handleDayToggle, statusOptions }) => {
    return (
        <div className="multi-day-event-section">
            <h2>Add Event to Multiple Days</h2>
            <form onSubmit={handleMultiDayEvent} className='multi-day-form'>
                <div className="days-selector">
                    {Object.keys(selectedDays).map(day => (
                        <label key={day} className={`day-checkbox ${selectedDays[day] ? 'selected' : ''}`}>
                            <input
                                type="checkbox"
                                checked={selectedDays[day]}
                                onChange={() => handleDayToggle(day)}
                            />
                            {day.slice(0, 3)}
                        </label>
                    ))}
                </div>
                <input
                    type="text"
                    name="title"
                    placeholder="Enter event title"
                    className="title-input"
                    required
                />
                <div className="time-inputs">
                    <input 
                        type="time"
                        name="startTime"
                        required
                        className="time-input"
                    />
                    <span>to</span>
                    <input 
                        type="time"
                        name="endTime"
                        required
                        className="time-input"
                    />
                    <select name="status" required className="status-select" defaultValue="Free">
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className='add-btn'>
                    Add to Selected Days
                </button>
            </form>
        </div>
    );
};

export default MultiDayEvent;