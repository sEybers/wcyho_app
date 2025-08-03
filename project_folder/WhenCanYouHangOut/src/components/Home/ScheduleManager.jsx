import React, { useState } from 'react';

/**
 * Schedule Manager Component
 * Handles schedule selection, creation, and view management
 */
function ScheduleManager({
    schedules,
    activeScheduleId,
    activeView,
    onScheduleSelect,
    onViewChange,
    onCreateSchedule,
    onDeleteSchedule,
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
    
    const scheduleList = Object.values(schedules).sort((a, b) => 
        new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
    );
    
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
        
        // Check for duplicate names
        const existingNames = Object.values(schedules).map(s => s.name.toLowerCase());
        if (existingNames.includes(newScheduleName.trim().toLowerCase())) {
            setFormError('A schedule with this name already exists');
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
    
    const views = [
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'editor', label: 'Editor', icon: '✏️' },
        { id: 'stats', label: 'Statistics', icon: '📊' }
    ];
    
    const templates = [
        { id: 'custom', label: 'Custom (Empty)', description: 'Start with a blank schedule' },
        { id: 'work-schedule', label: 'Work Schedule', description: '9 AM - 5 PM, Monday to Friday' },
        { id: 'study-schedule', label: 'Study Schedule', description: 'Morning and afternoon study blocks' },
        { id: 'weekend-schedule', label: 'Weekend Schedule', description: 'Free time on weekends' }
    ];
    
    return (
        <div className="schedule-manager">
            <div className="manager-header">
                <h2>Your Schedules</h2>
                <button 
                    className="create-btn"
                    onClick={onCreateSchedule}
                    disabled={saving}
                >
                    + New Schedule
                </button>
            </div>
            
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={onErrorDismiss} className="close-btn">×</button>
                </div>
            )}
            
            {showNewScheduleForm && (
                <div className="new-schedule-form">
                    <div className="form-header">
                        <h3>Create New Schedule</h3>
                        <button onClick={handleCancel} className="close-btn">×</button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="scheduleName">Schedule Name *</label>
                            <input
                                id="scheduleName"
                                type="text"
                                value={newScheduleName}
                                onChange={(e) => setNewScheduleName(e.target.value)}
                                placeholder="Enter schedule name..."
                                maxLength={50}
                                disabled={saving}
                                autoFocus
                            />
                            <small>{newScheduleName.length}/50 characters</small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="template">Template</label>
                            <select
                                id="template"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                disabled={saving}
                            >
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.label}
                                    </option>
                                ))}
                            </select>
                            <small>
                                {templates.find(t => t.id === selectedTemplate)?.description}
                            </small>
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
                                {saving ? 'Creating...' : 'Create Schedule'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="schedule-list">
                {scheduleList.map(schedule => (
                    <div 
                        key={schedule.id}
                        className={`schedule-item ${schedule.id === activeScheduleId ? 'active' : ''}`}
                        onClick={() => onScheduleSelect(schedule.id)}
                    >
                        <div className="schedule-info">
                            <h3>{schedule.name}</h3>
                            <p>
                                Last modified: {new Date(schedule.lastModified || schedule.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        
                        <div className="schedule-actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSchedule(schedule.id);
                                }}
                                className="delete-btn"
                                title="Delete schedule"
                                disabled={saving}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {scheduleList.length > 0 && (
                <div className="view-selector">
                    <h3>View</h3>
                    <div className="view-buttons">
                        {views.map(view => (
                            <button
                                key={view.id}
                                onClick={() => onViewChange(view.id)}
                                className={`view-btn ${activeView === view.id ? 'active' : ''}`}
                            >
                                <span className="view-icon">{view.icon}</span>
                                <span className="view-label">{view.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScheduleManager;
