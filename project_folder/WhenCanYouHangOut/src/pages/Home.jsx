import React, { useState } from 'react';
import '../css/Home.css'

function Home() {
    // Modified state to track unavailability and availability status
    const [schedule, setSchedule] = useState({
        Sunday: { unavailable: [], status: 'Free' },
        Monday: { unavailable: [], status: 'Free' },
        Tuesday: { unavailable: [], status: 'Free' },
        Wednesday: { unavailable: [], status: 'Free' },
        Thursday: { unavailable: [], status: 'Free' },
        Friday: { unavailable: [], status: 'Free' },
        Saturday: { unavailable: [], status: 'Free' }
    });

    // Handler for adding unavailable time slots
    const handleAddUnavailable = (day, e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newUnavailable = formData.get('unavailable');
        
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                unavailable: [...prev[day].unavailable, newUnavailable]
            }
        }));
        e.target.reset(); // Reset form after submission
    };

    // Handler for removing unavailable time slots
    const handleRemoveUnavailable = (day, index) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                unavailable: prev[day].unavailable.filter((_, i) => i !== index)
            }
        }));
    };

    // Handler for changing availability status
    const handleStatusChange = (day, status) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                status: status
            }
        }));
    };

    const days = Object.keys(schedule);
    const statusOptions = ['Not Free', 'Maybe Free', 'Free'];

    return (
        <div className="home-container">
            <h3>WHEN CAN YOU HANGOUT?</h3>
            <h1>Dashboard</h1>

            <div className='week-card'>
                <h2>Week Overview</h2>
                <h3>Enter your unavailable times and general availability</h3>
                
                <div className='week-card-content'>
                    {days.map(day => (
                        <div key={day} className={`day-container ${schedule[day].status.toLowerCase().replace(' ', '-')}`}>
                            <h4>{day}</h4>
                            <div className="status-selector">
                                <p>Day Status:</p>
                                {statusOptions.map(status => (
                                    <button
                                        key={status}
                                        className={`status-btn ${schedule[day].status === status ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(day, status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <div className="unavailable-times">
                                <h5>Unavailable Times:</h5>
                                {schedule[day].unavailable.map((time, index) => (
                                    <div key={index} className="unavailable-slot">
                                        <span>{time}</span>
                                        <button 
                                            onClick={() => handleRemoveUnavailable(day, index)}
                                            className="remove-btn"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <form 
                                onSubmit={(e) => handleAddUnavailable(day, e)} 
                                className='weekday-form'
                            >
                                <input 
                                    type="text"
                                    name="unavailable"
                                    placeholder="e.g., 2 PM - 4 PM"
                                    className="availability-input"
                                />
                                <button type="submit" className='add-btn'>
                                    Add Unavailable Time
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;