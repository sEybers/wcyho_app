import React, { useState } from 'react';

/**
 * Welcome Screen Component
 * Shown when user has no schedules
 */
function WelcomeScreen({
    onCreateSchedule,
    showNewScheduleForm,
    onCloseForm,
    onSubmitSchedule,
    saving,
    error,
    onErrorDismiss
}) {
    const [newScheduleName, setNewScheduleName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('custom');
    const [formError, setFormError] = useState('');
    
    const templates = [
        { 
            id: 'custom', 
            label: 'Custom (Empty)', 
            description: 'Start with a blank schedule and add your own events',
            icon: '📝'
        },
        { 
            id: 'work-schedule', 
            label: 'Work Schedule', 
            description: 'Standard 9 AM - 5 PM work hours, Monday to Friday',
            icon: '💼'
        },
        { 
            id: 'study-schedule', 
            label: 'Study Schedule', 
            description: 'Morning and afternoon study blocks for students',
            icon: '📚'
        },
        { 
            id: 'weekend-schedule', 
            label: 'Weekend Schedule', 
            description: 'Free time availability on weekends',
            icon: '🎉'
        }
    ];
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        
        if (!newScheduleName.trim()) {
            setFormError('Schedule name is required');
            return;
        }
        
        if (newScheduleName.trim().length > 50) {
            setFormError('Schedule name must be 50 characters or less');
            return;
        }
        
        try {
            await onSubmitSchedule(newScheduleName.trim(), selectedTemplate);
            setNewScheduleName('');
            setSelectedTemplate('custom');
            setFormError('');
        } catch (error) {
            setFormError(error.message || 'Failed to create schedule');
        }
    };
    
    const handleCancel = () => {
        setNewScheduleName('');
        setSelectedTemplate('custom');
        setFormError('');
        onCloseForm();
    };
    
    return (
        <div className="welcome-screen">
            <div className="welcome-content">
                <div className="welcome-header">
                    <h1>Welcome to Schedule Manager!</h1>
                    <p>Get started by creating your first schedule to track your availability and coordinate with friends.</p>
                </div>
                
                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={onErrorDismiss} className="close-btn">×</button>
                    </div>
                )}
                
                {!showNewScheduleForm ? (
                    <div className="welcome-actions">
                        <div className="feature-highlights">
                            <div className="feature-item">
                                <div className="feature-icon">🗓️</div>
                                <h3>Track Your Availability</h3>
                                <p>Mark when you're free, busy, or maybe available throughout the week</p>
                            </div>
                            
                            <div className="feature-item">
                                <div className="feature-icon">👥</div>
                                <h3>Coordinate with Friends</h3>
                                <p>Compare schedules to find the perfect time to hang out</p>
                            </div>
                            
                            <div className="feature-item">
                                <div className="feature-icon">📊</div>
                                <h3>Get Insights</h3>
                                <p>View statistics and patterns in your schedule to optimize your time</p>
                            </div>
                        </div>
                        
                        <button 
                            className="create-first-schedule-btn"
                            onClick={onCreateSchedule}
                            disabled={saving}
                        >
                            Create Your First Schedule
                        </button>
                    </div>
                ) : (
                    <div className="schedule-creation-wizard">
                        <div className="wizard-header">
                            <h2>Create Your First Schedule</h2>
                            <p>Choose a name and template to get started quickly</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="creation-form">
                            <div className="form-step">
                                <h3>Step 1: Name Your Schedule</h3>
                                <div className="form-group">
                                    <label htmlFor="scheduleName">Schedule Name *</label>
                                    <input
                                        id="scheduleName"
                                        type="text"
                                        value={newScheduleName}
                                        onChange={(e) => setNewScheduleName(e.target.value)}
                                        placeholder="e.g., My Weekly Schedule, Work & Personal, Fall 2024"
                                        maxLength={50}
                                        disabled={saving}
                                        autoFocus
                                    />
                                    <div className="input-help">
                                        <small>{newScheduleName.length}/50 characters</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-step">
                                <h3>Step 2: Choose a Template</h3>
                                <div className="template-grid">
                                    {templates.map(template => (
                                        <label
                                            key={template.id}
                                            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="template"
                                                value={template.id}
                                                checked={selectedTemplate === template.id}
                                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                                disabled={saving}
                                            />
                                            <div className="template-content">
                                                <div className="template-icon">{template.icon}</div>
                                                <h4>{template.label}</h4>
                                                <p>{template.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            {formError && (
                                <div className="form-error">{formError}</div>
                            )}
                            
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving || !newScheduleName.trim()}
                                    className="submit-btn"
                                >
                                    {saving ? 'Creating Schedule...' : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WelcomeScreen;
