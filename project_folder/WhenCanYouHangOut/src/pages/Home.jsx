import React, { useState, useEffect } from 'react';
import SleepSchedule from '../components/SleepSchedule/SleepSchedule';
import MultiDayEvent from '../components/MultiDayEvent/MultiDayEvent';
import DaySchedule from '../components/DaySchedule/DaySchedule';
import HourlySchedule from '../components/HourlySchedule/HourlySchedule';
import { apiService } from '../services/api.js';
import '../css/Home.css';

/**
 * Home Component
 * Main dashboard for managing schedules and time ranges
 */
function Home() {
    // State for managing all schedules and active schedule
    const [schedules, setSchedules] = useState({});
    const [activeScheduleId, setActiveScheduleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Initialize schedule state based on whether there's an active schedule
    const [schedule, setSchedule] = useState(null);

    // Show form by default if no schedules exist
    const [showNewScheduleForm, setShowNewScheduleForm] = useState(false);

    // Load schedules when component mounts
    useEffect(() => {
        const loadSchedules = async () => {
            try {
                setLoading(true);
                const schedulesData = await apiService.getSchedules();
                
                // Convert array to object with schedule id as key
                const schedulesObj = {};
                if (Array.isArray(schedulesData)) {
                    schedulesData.forEach(schedule => {
                        schedulesObj[schedule.id] = schedule;
                    });
                }
                
                setSchedules(schedulesObj);
                
                // Set active schedule to first one if any exist
                const scheduleIds = Object.keys(schedulesObj);
                if (scheduleIds.length > 0) {
                    const firstId = scheduleIds[0];
                    setActiveScheduleId(firstId);
                    setSchedule(schedulesObj[firstId].schedule);
                } else {
                    setShowNewScheduleForm(true);
                }
            } catch (error) {
                console.error('Error loading schedules:', error);
                setError('Failed to load schedules');
                setShowNewScheduleForm(true);
            } finally {
                setLoading(false);
            }
        };

        loadSchedules();
    }, []);

    // Update schedule when active schedule changes
    useEffect(() => {
        if (activeScheduleId && schedules[activeScheduleId]) {
            setSchedule(schedules[activeScheduleId].schedule);
        }
    }, [activeScheduleId, schedules]);

    // State for managing sleep schedule
    const [sleepSchedule, setSleepSchedule] = useState({
        start: '',
        end: '',
        enabled: false
    });

    // State for tracking which days are selected in multi-day event form
    const [selectedDays, setSelectedDays] = useState({
        Sunday: true,
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: true
    });

    /**
     * Handles adding a new time range to a specific day
     * Validates time inputs and prevents invalid time ranges
     * 
     * @param {string} day - Day of the week
     * @param {Event} e - Form submission event
     */
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
        
        const newSchedule = {
            ...schedule,
            [day]: {
                ...schedule[day],
                timeRanges: [...schedule[day].timeRanges, timeRange]
            }
        };

        updateSchedule(newSchedule);
        e.target.reset();
    };

    /**
     * Updates both local and global schedule states
     * Ensures consistency between component and app-level states
     * 
     * @param {Object} newSchedule - Updated schedule object
     */
    const updateSchedule = (newSchedule) => {
        setSchedule(newSchedule);
        setSchedules(prev => ({
            ...prev,
            [activeScheduleId]: {
                ...prev[activeScheduleId],
                schedule: newSchedule
            }
        }));
    };

    /**
     * Removes a specific time range from a day's schedule
     * 
     * @param {string} day - Day of the week
     * @param {string|number} id - Unique identifier of the time range
     */
    const handleRemoveTimeRange = (day, id) => {
        const newSchedule = {
            ...schedule,
            [day]: {
                ...schedule[day],
                timeRanges: schedule[day].timeRanges.filter(range => range.id !== id)
            }
        };

        updateSchedule(newSchedule);
    };

    /**
     * Handles creation and application of sleep schedule
     * Applies sleep schedule to all days in the current schedule
     * 
     * @param {Event} e - Form submission event
     */
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
        const newSchedule = { ...schedule };
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

        updateSchedule(newSchedule);

        e.target.reset();
    };

    /**
     * Removes sleep schedule from all days
     * Resets sleep schedule state
     */
    const handleRemoveSleepSchedule = () => {
        setSleepSchedule({
            start: '',
            end: '',
            enabled: false
        });

        // Remove sleep schedule from all days
        const newSchedule = { ...schedule };
        Object.keys(newSchedule).forEach(day => {
            newSchedule[day].timeRanges = newSchedule[day].timeRanges
                .filter(range => range.title !== 'Sleep');
        });

        updateSchedule(newSchedule);
    };

    /**
     * Checks if a time range already exists in the schedule
     * Prevents duplicate entries
     * 
     * @param {Array} existingRanges - Current time ranges
     * @param {Object} newRange - Time range to check
     * @returns {boolean} - True if duplicate found
     */
    const isDuplicateTimeRange = (existingRanges, newRange) => {
        return existingRanges.some(range => 
            range.start === newRange.start && 
            range.end === newRange.end && 
            range.title === newRange.title
        );
    };

    /**
     * Handles adding events to multiple selected days
     * Validates time inputs and prevents duplicates
     * 
     * @param {Event} e - Form submission event
     */
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

        // Create new schedule object
        const newSchedule = { ...schedule };

        // Add event to each selected day
        Object.entries(selectedDays).forEach(([day, isSelected]) => {
            if (isSelected) {
                // Create a unique timeRange object for each day
                const timeRange = {
                    title: title || 'Untitled',
                    start: startTime,
                    end: endTime,
                    status: status,
                    id: Date.now() + Math.random() // Ensure unique ID for each instance
                };

                // Add to day's timeRanges if not duplicate
                if (!isDuplicateTimeRange(newSchedule[day].timeRanges, timeRange)) {
                    newSchedule[day].timeRanges = [
                        ...newSchedule[day].timeRanges,
                        timeRange
                    ];
                }
            }
        });

        // Update the schedule state
        setSchedule(newSchedule);
        
        // Update the schedules state to persist changes
        setSchedules(prev => ({
            ...prev,
            [activeScheduleId]: {
                ...prev[activeScheduleId],
                schedule: newSchedule
            }
        }));

        e.target.reset();
    };

    /**
     * Toggles selection state of a day in multi-day event form
     * 
     * @param {string} day - Day to toggle
     */
    const handleDayToggle = (day) => {
        setSelectedDays(prev => ({
            ...prev,
            [day]: !prev[day]
        }));
    };

    /**
     * Creates a formatted string representation of a time range
     * 
     * @param {Object} timeRange - Time range object to format
     * @returns {string} - Formatted time range string
     */
    const formatTimeSlot = (timeRange) => {
        return `${timeRange.title}: ${formatTime(timeRange.start)} - ${formatTime(timeRange.end)} (${timeRange.status})`;
    };

    /**
     * Converts 24-hour time format to 12-hour format with AM/PM
     * 
     * @param {string} time - Time in 24-hour format
     * @returns {string} - Formatted time in 12-hour format
     */
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour = hours % 12 || 12;
        return `${hour}:${minutes} ${period}`;
    };

    // Constants for component operation
    const days = schedule ? Object.keys(schedule) : [];
    // Update the order to make Free first
    const statusOptions = ['Free', 'Maybe Free', 'Not Free'];

    // Add these handlers before the return statement
    const handleCreateNewSchedule = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const scheduleName = formData.get('scheduleName');

        try {
            // Call the API to create schedule
            const createdSchedule = await apiService.createSchedule(scheduleName);
            
            // Update schedules state with new schedule
            setSchedules(prev => ({
                ...prev,
                [createdSchedule.id]: createdSchedule
            }));

            // Don't automatically switch to new schedule - let user manually switch
            // This prevents appearing to "overwrite" the current schedule
            
            // Close the form
            setShowNewScheduleForm(false);
            e.target.reset();
            
            // Show success message
            setError(`Schedule "${scheduleName}" created successfully! You can switch to it using the dropdown above.`);
            setTimeout(() => setError(''), 5000);
        } catch (error) {
            console.error('Error creating schedule:', error);
            setError('Failed to create schedule');
        }
    };

    const handleSwitchSchedule = (scheduleId) => {
        if (schedules && schedules[scheduleId]) {
            setActiveScheduleId(scheduleId);
            setSchedule(schedules[scheduleId].schedule);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        try {
            // Call the API to delete schedule
            await apiService.deleteSchedule(scheduleId);
            
            // Update local state
            setSchedules(prev => {
                const newSchedules = { ...prev };
                delete newSchedules[scheduleId];
                return newSchedules;
            });
            
            // If there are other schedules, switch to the first one
            // Otherwise, clear the active schedule
            const remainingIds = schedules ? Object.keys(schedules).filter(id => id !== scheduleId) : [];
            if (remainingIds.length > 0 && schedules) {
                setActiveScheduleId(remainingIds[0]);
                setSchedule(schedules[remainingIds[0]].schedule);
            } else {
                setActiveScheduleId(null);
                setSchedule(null);
                setShowNewScheduleForm(true);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            setError('Failed to delete schedule');
        }
    };

    // Component render method with schedule management UI
    return (
        <div className="home-container">
            <h1>Dashboard</h1>
            
            {/* Loading state */}
            {loading && (
                <div className="loading">
                    <p>Loading schedules...</p>
                </div>
            )}
            
            {/* Error state */}
            {error && (
                <div className="error">
                    <p>Error: {error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
            
            {/* Show welcome message if no schedules exist */}
            {!loading && (!schedules || Object.keys(schedules).length === 0) && (
                <div className="welcome-section">
                    <h2>Welcome to When Can You Hang Out?</h2>
                    <p>Get started by creating your first schedule.</p>
                </div>
            )}
            
            {/* Show schedule management if schedules exist and not loading */}
            {!loading && schedules && Object.keys(schedules).length > 0 && (
                <div className="schedule-management">
                    <div className="schedule-selector">
                        <select 
                            value={activeScheduleId || ''}
                            onChange={(e) => handleSwitchSchedule(e.target.value)}
                        >
                            {Object.entries(schedules).map(([id, { name }]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => handleDeleteSchedule(activeScheduleId)}
                            className="delete-schedule-btn"
                        >
                            Delete Schedule
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => setShowNewScheduleForm(true)}
                        className="new-schedule-btn"
                    >
                        Create New Schedule
                    </button>
                </div>
            )}
            
            {showNewScheduleForm && (
                <form onSubmit={handleCreateNewSchedule} className="new-schedule-form">
                    <input
                        type="text"
                        name="scheduleName"
                        placeholder="Enter schedule name"
                        required
                        autoFocus
                    />
                    <button type="submit">Create</button>
                    {schedules && Object.keys(schedules).length > 0 && (
                        <button 
                            type="button" 
                            onClick={() => setShowNewScheduleForm(false)}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            )}

            {/* Only show schedule content if there is an active schedule */}
            {activeScheduleId && schedule && (
                <div className="week-card">
                    <SleepSchedule
                        sleepSchedule={sleepSchedule}
                        handleSleepSchedule={handleSleepSchedule}
                        handleRemoveSleepSchedule={handleRemoveSleepSchedule}
                        formatTime={formatTime}
                    />

                    <MultiDayEvent
                        selectedDays={selectedDays}
                        handleMultiDayEvent={handleMultiDayEvent}
                        handleDayToggle={handleDayToggle}
                        statusOptions={statusOptions}
                    />

                    <div className='week-card-content'>
                        {Object.entries(schedule).map(([day, { timeRanges }]) => (
                            <DaySchedule
                                key={day}
                                day={day}
                                timeRanges={timeRanges}
                                handleAddTimeRange={handleAddTimeRange}
                                handleRemoveTimeRange={handleRemoveTimeRange}
                                formatTimeSlot={formatTimeSlot}
                                statusOptions={statusOptions}
                            />
                        ))}
                    </div>
                </div>
            )}

            <HourlySchedule 
                schedule={schedule} 
                className="home-view"
            />
        </div>
    );
}

export default Home;