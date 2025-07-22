import React from 'react';
import '../../css/DaySchedule.css';

const DaySchedule = ({ day, timeRanges, handleAddTimeRange, handleRemoveTimeRange, formatTimeSlot, statusOptions }) => {
    return (
        <div className="day-container">
            <h4>{day}</h4>
            <div className="time-ranges">
                <h5>Time Ranges:</h5>
                {timeRanges.map((timeRange) => (
                    <div key={timeRange.id} 
                         className={`time-slot ${timeRange.status.toLowerCase().replace(' ', '-')}`}>
                        <span>{formatTimeSlot(timeRange)}</span>
                        <button 
                            onClick={() => handleRemoveTimeRange(day, timeRange.id)}
                            className="remove-btn"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            
            <form 
                onSubmit={(e) => handleAddTimeRange(day, e)} 
                className='weekday-form'
            >
                <input
                    type="text"
                    name="title"
                    placeholder="Enter title"
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
                    <select name="status" required className="status-select">
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className='add-btn'>
                    Add Time Range
                </button>
            </form>
        </div>
    );
};

export default DaySchedule;