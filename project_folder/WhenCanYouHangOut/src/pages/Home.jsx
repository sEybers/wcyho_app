import React, { useState } from 'react';
import '../css/Home.css'

function Home() {
    const [sleepSchedule, setSleepSchedule] = useState({
        start: '',
        end: '',
        enabled: false
    });

    const [schedule, setSchedule] = useState({
        Sunday: { timeRanges: [] },
        Monday: { timeRanges: [] },
        Tuesday: { timeRanges: [] },
        Wednesday: { timeRanges: [] },
        Thursday: { timeRanges: [] },
        Friday: { timeRanges: [] },
        Saturday: { timeRanges: [] }
    });

    const [selectedDays, setSelectedDays] = useState({
        Sunday: true,
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: true
    });

    // Handler for adding time ranges with status
    const handleAddTimeRange = (day, e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const startTime = formData.get('startTime');
        const endTime = formData.get('endTime');
        const status = formData.get('status');
        const title = formData.get('title'); // Add this line

        // Validate times
        if (!startTime || !endTime) {
            alert('Please enter both start and end times');
            return;
        }

        // Convert to Date objects for comparison
        const start = new Date(`2000/01/01 ${startTime}`);
        const end = new Date(`2000/01/01 ${endTime}`);

        if (start >= end) {
            alert('End time must be after start time');
            return;
        }

        const timeRange = {
            title: title || 'Untitled', // Add default title if none provided
            start: startTime,
            end: endTime,
            status: status,
            id: Date.now()
        };
        
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeRanges: [...prev[day].timeRanges, timeRange]
            }
        }));
        e.target.reset();
    };

    // Handler for removing time ranges
    const handleRemoveTimeRange = (day, id) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeRanges: prev[day].timeRanges.filter(range => range.id !== id)
            }
        }));
    };

    // Add handler for sleep schedule
    const handleSleepSchedule = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const startTime = formData.get('sleepStart');
        const endTime = formData.get('sleepEnd');

        setSleepSchedule({
            start: startTime,
            end: endTime,
            enabled: true
        });

        // Apply sleep schedule to all days
        setSchedule(prev => {
            const newSchedule = { ...prev };
            Object.keys(newSchedule).forEach(day => {
                // First remove any existing sleep schedules
                newSchedule[day].timeRanges = newSchedule[day].timeRanges
                    .filter(range => range.title !== 'Sleep');
                
                // Then add the new sleep schedule
                newSchedule[day].timeRanges.push({
                    title: 'Sleep',
                    start: startTime,
                    end: endTime,
                    status: 'Not Free',
                    id: Date.now() + day.length
                });
            });
            return newSchedule;
        });

        e.target.reset();
    };

    // Add handler to remove sleep schedule
    const handleRemoveSleepSchedule = () => {
        setSleepSchedule({
            start: '',
            end: '',
            enabled: false
        });

        // Remove sleep schedule from all days
        setSchedule(prev => {
            const newSchedule = { ...prev };
            Object.keys(newSchedule).forEach(day => {
                newSchedule[day].timeRanges = newSchedule[day].timeRanges
                    .filter(range => range.title !== 'Sleep');
            });
            return newSchedule;
        });
    };

    // Add this new handler function
    const handleMultiDayEvent = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const title = formData.get('title');
        const startTime = formData.get('startTime');
        const endTime = formData.get('endTime');
        const status = formData.get('status');

        // Validate times
        if (!startTime || !endTime) {
            alert('Please enter both start and end times');
            return;
        }

        const start = new Date(`2000/01/01 ${startTime}`);
        const end = new Date(`2000/01/01 ${endTime}`);

        if (start >= end) {
            alert('End time must be after start time');
            return;
        }

        // Update schedule for selected days
        setSchedule(prev => {
            const newSchedule = { ...prev };
            Object.entries(selectedDays).forEach(([day, isSelected]) => {
                if (isSelected) {
                    newSchedule[day].timeRanges.push({
                        title: title || 'Untitled',
                        start: startTime,
                        end: endTime,
                        status: status,
                        id: Date.now() + Math.random()
                    });
                }
            });
            return newSchedule;
        });

        e.target.reset();
    };

    // Add this toggle handler
    const handleDayToggle = (day) => {
        setSelectedDays(prev => ({
            ...prev,
            [day]: !prev[day]
        }));
    };

    const formatTimeSlot = (timeRange) => {
        return `${timeRange.title}: ${formatTime(timeRange.start)} - ${formatTime(timeRange.end)} (${timeRange.status})`;
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour = hours % 12 || 12;
        return `${hour}:${minutes} ${period}`;
    };

    const days = Object.keys(schedule);
    const statusOptions = ['Not Free', 'Maybe Free', 'Free'];

    return (
        <div className="home-container">
            <h3>WHEN CAN YOU HANGOUT?</h3>
            <h1>Dashboard</h1>

            <div className='week-card'>
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
                
                <div className='week-card-content'>
                    {days.map(day => (
                        <div key={day} className="day-container">
                            <h4>{day}</h4>
                            <div className="time-ranges">
                                <h5>Time Ranges:</h5>
                                {schedule[day].timeRanges.map((timeRange) => (
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
                                    placeholder="Enter title (e.g., Work, Study)"
                                    className="title-input"
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
                    ))}
                </div>
            </div>

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
                        <select name="status" required className="status-select">
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
        </div>
    );
}

export default Home;