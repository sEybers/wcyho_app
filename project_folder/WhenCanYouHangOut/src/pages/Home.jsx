import React, { useState } from 'react';
import SleepSchedule from '../components/SleepSchedule/SleepSchedule';
import MultiDayEvent from '../components/MultiDayEvent/MultiDayEvent';
import DaySchedule from '../components/DaySchedule/DaySchedule';
import './Home.css';

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
        </div>
    );
}

export default Home;