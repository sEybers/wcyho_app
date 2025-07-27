import React from 'react';
import '../../css/DaySchedule.css';

const DaySchedule = ({ day, timeRanges, handleAddTimeRange, handleRemoveTimeRange, statusOptions }) => {
    return (
        <div className="day-schedule">
            <h3 className="day-header">{day}</h3>
            {timeRanges.map((range) => (
                <div key={range.id} className="time-range">
                    <div className="time-range-header">
                        <div className="time-range-info">
                            <div className="time-range-title">{range.title}</div>
                            <div className="time-range-time">
                                {range.start} - {range.end}
                            </div>
                        </div>
                        <span className={`time-range-status ${range.status.replace(' ', '-')}`}>
                            {range.status}
                        </span>
                    </div>
                    <button
                        onClick={() => handleRemoveTimeRange(day, range.id)}
                        className="remove-time-range"
                    >
                        Remove
                    </button>
                </div>
            ))}
            
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
                    <select name="status" required className="status-select" defaultValue="Free">
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