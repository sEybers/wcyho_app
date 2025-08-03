import React, { useState, useCallback } from 'react';
import { DAYS_OF_WEEK, STATUS_TYPES } from '../../utils/timeUtils.js';

/**
 * Schedule Editor Component
 * Advanced schedule editing with day view and time management
 */
function ScheduleEditor({
    schedule,
    scheduleData,
    selectedDay,
    searchQuery,
    filterStatus,
    onScheduleUpdate,
    onDaySelect,
    onSearchChange,
    onFilterChange,
    saving
}) {
    const [editingEvent, setEditingEvent] = useState(null);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [showMultiDayEvent, setShowMultiDayEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: '09:00',
        end: '17:00',
        status: 'Not Free'
    });
    const [multiDayEvent, setMultiDayEvent] = useState({
        title: '',
        start: '09:00',
        end: '17:00',
        status: 'Not Free',
        selectedDays: []
    });
    
    const dayRanges = scheduleData[selectedDay] || [];
    
    const filteredRanges = dayRanges.filter(range => {
        const matchesSearch = !searchQuery || 
            range.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || range.status === filterStatus;
        return matchesSearch && matchesFilter;
    });
    
    const handleAddEvent = useCallback(async () => {
        if (!newEvent.title.trim() || newEvent.start >= newEvent.end) return;
        
        const eventToAdd = {
            title: newEvent.title.trim(),
            start: newEvent.start,
            end: newEvent.end,
            status: newEvent.status
            // Remove the string ID - let the backend handle IDs if needed
        };
        
        const updatedSchedule = {
            ...schedule.schedule,
            [selectedDay]: {
                ...schedule.schedule[selectedDay],
                timeRanges: [...(schedule.schedule[selectedDay]?.timeRanges || []), eventToAdd]
            }
        };
        
        try {
            await onScheduleUpdate({ schedule: updatedSchedule });
            setNewEvent({
                title: '',
                start: '09:00',
                end: '17:00',
                status: 'Not Free'
            });
            setShowAddEvent(false);
        } catch (error) {
            console.error('Failed to add event:', error);
            // Show more detailed error information
            if (error.response?.data) {
                console.error('Server error details:', error.response.data);
            }
        }
    }, [newEvent, schedule, selectedDay, onScheduleUpdate]);
    
    const handleAddMultiDayEvent = useCallback(async () => {
        if (!multiDayEvent.title.trim() || 
            multiDayEvent.start >= multiDayEvent.end || 
            multiDayEvent.selectedDays.length === 0) {
            return;
        }
        
        const eventToAdd = {
            title: multiDayEvent.title.trim(),
            start: multiDayEvent.start,
            end: multiDayEvent.end,
            status: multiDayEvent.status
        };
        
        // Create updated schedule with event added to all selected days
        const updatedSchedule = { ...schedule.schedule };
        
        multiDayEvent.selectedDays.forEach(day => {
            if (!updatedSchedule[day]) {
                updatedSchedule[day] = { timeRanges: [] };
            }
            updatedSchedule[day] = {
                ...updatedSchedule[day],
                timeRanges: [...(updatedSchedule[day].timeRanges || []), { ...eventToAdd }]
            };
        });
        
        try {
            await onScheduleUpdate({ schedule: updatedSchedule });
            setMultiDayEvent({
                title: '',
                start: '09:00',
                end: '17:00',
                status: 'Not Free',
                selectedDays: []
            });
            setShowMultiDayEvent(false);
        } catch (error) {
            console.error('Failed to add multi-day event:', error);
            if (error.response?.data) {
                console.error('Server error details:', error.response.data);
            }
        }
    }, [multiDayEvent, schedule, onScheduleUpdate]);
    
    const handleUpdateEvent = useCallback(async (eventId, updates) => {
        const dayData = schedule.schedule[selectedDay];
        if (!dayData?.timeRanges) return;
        
        const updatedRanges = dayData.timeRanges.map(range => {
            // Handle both string and ObjectId comparisons
            const rangeId = range._id || range.id;
            const targetId = eventId;
            
            return rangeId === targetId ? { ...range, ...updates } : range;
        });
        
        const updatedSchedule = {
            ...schedule.schedule,
            [selectedDay]: {
                ...dayData,
                timeRanges: updatedRanges
            }
        };
        
        try {
            await onScheduleUpdate({ schedule: updatedSchedule });
            setEditingEvent(null);
        } catch (error) {
            console.error('Failed to update event:', error);
            if (error.response?.data) {
                console.error('Server error details:', error.response.data);
            }
        }
    }, [schedule, selectedDay, onScheduleUpdate]);
    
    const handleDeleteEvent = useCallback(async (eventId) => {
        const dayData = schedule.schedule[selectedDay];
        if (!dayData?.timeRanges) return;
        
        const confirmed = window.confirm('Are you sure you want to delete this event?');
        if (!confirmed) return;
        
        const updatedRanges = dayData.timeRanges.filter(range => {
            const rangeId = range._id || range.id;
            return rangeId !== eventId;
        });
        
        const updatedSchedule = {
            ...schedule.schedule,
            [selectedDay]: {
                ...dayData,
                timeRanges: updatedRanges
            }
        };
        
        try {
            await onScheduleUpdate({ schedule: updatedSchedule });
        } catch (error) {
            console.error('Failed to delete event:', error);
            if (error.response?.data) {
                console.error('Server error details:', error.response.data);
            }
        }
    }, [schedule, selectedDay, onScheduleUpdate]);
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Free': return '#4CAF50';
            case 'Not Free': return '#F44336';
            case 'Maybe Free': return '#FF9800';
            default: return '#9E9E9E';
        }
    };
    
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    };
    
    return (
        <div className="schedule-editor">
            <div className="editor-header">
                <h2>Schedule Editor</h2>
                <div className="editor-controls">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="search-input"
                    />
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        {STATUS_TYPES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="day-selector">
                {DAYS_OF_WEEK.map(day => (
                    <button
                        key={day}
                        onClick={() => onDaySelect(day)}
                        className={`day-btn ${selectedDay === day ? 'active' : ''}`}
                    >
                        {day.substring(0, 3)}
                        <span className="event-count">
                            {scheduleData[day]?.length || 0}
                        </span>
                    </button>
                ))}
            </div>
            
            <div className="day-editor">
                <div className="day-header">
                    <h3>{selectedDay}</h3>
                    <div className="day-header-actions">
                        <button
                            onClick={() => setShowMultiDayEvent(true)}
                            className="add-multi-day-btn"
                            disabled={saving}
                            title="Add event to multiple days"
                        >
                            📅 Multi-Day Event
                        </button>
                        <button
                            onClick={() => setShowAddEvent(true)}
                            className="add-event-btn"
                            disabled={saving}
                        >
                            + Add Event
                        </button>
                    </div>
                </div>
                
                {showAddEvent && (
                    <div className="add-event-form">
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder="Event title..."
                                value={newEvent.title}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                className="title-input"
                            />
                        </div>
                        
                        <div className="form-row">
                            <input
                                type="time"
                                value={newEvent.start}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, start: e.target.value }))}
                                className="time-input"
                            />
                            <span>to</span>
                            <input
                                type="time"
                                value={newEvent.end}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, end: e.target.value }))}
                                className="time-input"
                            />
                            <select
                                value={newEvent.status}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, status: e.target.value }))}
                                className="status-select"
                            >
                                {STATUS_TYPES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-actions">
                            <button
                                onClick={() => setShowAddEvent(false)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEvent}
                                disabled={!newEvent.title.trim() || newEvent.start >= newEvent.end}
                                className="save-btn"
                            >
                                Add Event
                            </button>
                        </div>
                    </div>
                )}
                
                {showMultiDayEvent && (
                    <div className="multi-day-event-form">
                        <div className="form-header">
                            <h4>📅 Add Event to Multiple Days</h4>
                            <button 
                                onClick={() => setShowMultiDayEvent(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder="Event title..."
                                value={multiDayEvent.title}
                                onChange={(e) => setMultiDayEvent(prev => ({ ...prev, title: e.target.value }))}
                                className="title-input"
                            />
                        </div>
                        
                        <div className="form-row">
                            <input
                                type="time"
                                value={multiDayEvent.start}
                                onChange={(e) => setMultiDayEvent(prev => ({ ...prev, start: e.target.value }))}
                                className="time-input"
                            />
                            <span>to</span>
                            <input
                                type="time"
                                value={multiDayEvent.end}
                                onChange={(e) => setMultiDayEvent(prev => ({ ...prev, end: e.target.value }))}
                                className="time-input"
                            />
                            <select
                                value={multiDayEvent.status}
                                onChange={(e) => setMultiDayEvent(prev => ({ ...prev, status: e.target.value }))}
                                className="status-select"
                            >
                                {STATUS_TYPES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="day-selection">
                            <label className="form-label">Select Days:</label>
                            {multiDayEvent.selectedDays.length > 0 && (
                                <div className="selected-days-preview">
                                    <span className="preview-label">Selected:</span>
                                    <span className="preview-days">
                                        {multiDayEvent.selectedDays.join(', ')}
                                    </span>
                                </div>
                            )}
                            <div className="day-checkboxes">
                                {DAYS_OF_WEEK.map(day => (
                                    <label key={day} className="day-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={multiDayEvent.selectedDays.includes(day)}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setMultiDayEvent(prev => ({
                                                    ...prev,
                                                    selectedDays: isChecked
                                                        ? [...prev.selectedDays, day]
                                                        : prev.selectedDays.filter(d => d !== day)
                                                }));
                                            }}
                                        />
                                        <span className="day-label">{day}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="quick-select-buttons">
                                <button
                                    type="button"
                                    onClick={() => setMultiDayEvent(prev => ({
                                        ...prev,
                                        selectedDays: DAYS_OF_WEEK.slice(1, 6) // Monday to Friday
                                    }))}
                                    className="quick-select-btn"
                                >
                                    Weekdays
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMultiDayEvent(prev => ({
                                        ...prev,
                                        selectedDays: ['Saturday', 'Sunday']
                                    }))}
                                    className="quick-select-btn"
                                >
                                    Weekends
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMultiDayEvent(prev => ({
                                        ...prev,
                                        selectedDays: DAYS_OF_WEEK
                                    }))}
                                    className="quick-select-btn"
                                >
                                    All Days
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMultiDayEvent(prev => ({
                                        ...prev,
                                        selectedDays: []
                                    }))}
                                    className="quick-select-btn clear"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        
                        <div className="form-actions">
                            <button
                                onClick={() => setShowMultiDayEvent(false)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMultiDayEvent}
                                disabled={
                                    !multiDayEvent.title.trim() || 
                                    multiDayEvent.start >= multiDayEvent.end ||
                                    multiDayEvent.selectedDays.length === 0
                                }
                                className="save-btn"
                            >
                                Add to {multiDayEvent.selectedDays.length} Day{multiDayEvent.selectedDays.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="events-list">
                    {filteredRanges.length === 0 ? (
                        <div className="no-events">
                            {dayRanges.length === 0 ? (
                                <p>No events scheduled for {selectedDay}</p>
                            ) : (
                                <p>No events match your current filters</p>
                            )}
                        </div>
                    ) : (
                        filteredRanges
                            .sort((a, b) => a.start.localeCompare(b.start))
                            .map(event => {
                                const eventId = event._id || event.id || `temp-${Math.random()}`;
                                return (
                                    <div
                                        key={eventId}
                                        className="event-item"
                                        style={{ borderLeft: `4px solid ${getStatusColor(event.status)}` }}
                                    >
                                        {editingEvent === eventId ? (
                                            <EventEditForm
                                                event={event}
                                                onSave={(updates) => handleUpdateEvent(eventId, updates)}
                                                onCancel={() => setEditingEvent(null)}
                                            />
                                        ) : (
                                            <EventDisplay
                                                event={event}
                                                onEdit={() => setEditingEvent(eventId)}
                                                onDelete={() => handleDeleteEvent(eventId)}
                                                formatTime={formatTime}
                                            />
                                        )}
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>
        </div>
    );
}

function EventDisplay({ event, onEdit, onDelete, formatTime }) {
    return (
        <div className="event-display">
            <div className="event-info">
                <h4>{event.title}</h4>
                <p>{formatTime(event.start)} - {formatTime(event.end)}</p>
                <span className={`status-badge status-${event.status.replace(/\s+/g, '-').toLowerCase()}`}>
                    {event.status}
                </span>
            </div>
            
            <div className="event-actions">
                <button onClick={onEdit} className="edit-btn" title="Edit event">
                    ✏️
                </button>
                <button onClick={onDelete} className="delete-btn" title="Delete event">
                    🗑️
                </button>
            </div>
        </div>
    );
}

function EventEditForm({ event, onSave, onCancel }) {
    const [editData, setEditData] = useState({
        title: event.title,
        start: event.start,
        end: event.end,
        status: event.status
    });
    
    const handleSave = () => {
        if (!editData.title.trim() || editData.start >= editData.end) return;
        onSave(editData);
    };
    
    return (
        <div className="event-edit-form">
            <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="title-input"
            />
            
            <div className="time-row">
                <input
                    type="time"
                    value={editData.start}
                    onChange={(e) => setEditData(prev => ({ ...prev, start: e.target.value }))}
                    className="time-input"
                />
                <span>to</span>
                <input
                    type="time"
                    value={editData.end}
                    onChange={(e) => setEditData(prev => ({ ...prev, end: e.target.value }))}
                    className="time-input"
                />
            </div>
            
            <select
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                className="status-select"
            >
                {STATUS_TYPES.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
            
            <div className="edit-actions">
                <button onClick={onCancel} className="cancel-btn">Cancel</button>
                <button 
                    onClick={handleSave}
                    disabled={!editData.title.trim() || editData.start >= editData.end}
                    className="save-btn"
                >
                    Save
                </button>
            </div>
        </div>
    );
}

export default ScheduleEditor;
