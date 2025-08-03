import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import SleepSchedule from '../components/SleepSchedule/SleepSchedule';
import MultiDayEvent from '../components/MultiDayEvent/MultiDayEvent';
import DaySchedule from '../components/DaySchedule/DaySchedule';
import HourlySchedule from '../components/HourlySchedule/HourlySchedule';
import { apiService } from '../services/api.js';
import { 
    validateTimeRange, 
    formatTimeDisplay, 
    mergeTimeRanges,
    findScheduleConflicts,
    DAYS_OF_WEEK,
    STATUS_TYPES 
} from '../utils/timeUtils.js';
import '../css/Home.css';

/**
 * Enhanced Home Component
 * Main dashboard for comprehensive schedule management with advanced features
 */
function Home() {
    const { user, isAuthenticated } = useAuth();
    
    // Core state management
    const [schedules, setSchedules] = useState({});
    const [activeScheduleId, setActiveScheduleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    
    // UI state
    const [showNewScheduleForm, setShowNewScheduleForm] = useState(false);
    const [activeView, setActiveView] = useState('week'); // 'week', 'day', 'summary'
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Schedule creation state
    const [scheduleTemplates] = useState([
        { name: 'Work Schedule', description: 'Monday-Friday work hours' },
        { name: 'Personal Schedule', description: 'Personal activities and commitments' },
        { name: 'Weekend Schedule', description: 'Weekend activities and free time' },
        { name: 'Study Schedule', description: 'Classes and study sessions' },
        { name: 'Custom Schedule', description: 'Create from scratch' }
    ]);
    
    // Advanced features state
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [selectedTimeRanges, setSelectedTimeRanges] = useState(new Set());
    const [scheduleStats, setScheduleStats] = useState(null);
    
    // Sleep schedule state
    const [sleepSchedule, setSleepSchedule] = useState({
        start: '',
        end: '',
        enabled: false
    });
    
    // Multi-day event state
    const [selectedDays, setSelectedDays] = useState(
        DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: true }), {})
    );

    // Memoized computed values for performance
    const activeSchedule = useMemo(() => {
        return activeScheduleId && schedules[activeScheduleId] 
            ? schedules[activeScheduleId].schedule 
            : null;
    }, [activeScheduleId, schedules]);

    const processedScheduleData = useMemo(() => {
        if (!activeSchedule) return {};
        
        const processed = {};
        DAYS_OF_WEEK.forEach(day => {
            if (activeSchedule[day]?.timeRanges) {
                processed[day] = mergeTimeRanges(activeSchedule[day].timeRanges);
            } else {
                processed[day] = [];
            }
        });
        
        return processed;
    }, [activeSchedule]);

    const filteredTimeRanges = useMemo(() => {
        if (!processedScheduleData[selectedDay]) return [];
        
        let ranges = processedScheduleData[selectedDay];
        
        // Apply search filter
        if (searchQuery) {
            ranges = ranges.filter(range => 
                range.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                range.status?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply status filter
        if (filterStatus !== 'all') {
            ranges = ranges.filter(range => 
                range.status?.toLowerCase().replace(/\s+/g, '-') === filterStatus
            );
        }
        
        return ranges;
    }, [processedScheduleData, selectedDay, searchQuery, filterStatus]);

    const scheduleStatistics = useMemo(() => {
        if (!activeSchedule) return null;
        
        let totalSlots = 0;
        let freeSlots = 0;
        let busySlots = 0;
        let maybeSlots = 0;
        let totalEvents = 0;
        
        DAYS_OF_WEEK.forEach(day => {
            const dayRanges = processedScheduleData[day] || [];
            totalEvents += dayRanges.length;
            
            // Count hourly slots (simplified to 24 hours per day)
            for (let hour = 0; hour < 24; hour++) {
                totalSlots++;
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                
                const hasEvent = dayRanges.some(range => {
                    const startHour = parseInt(range.start.split(':')[0]);
                    const endHour = parseInt(range.end.split(':')[0]);
                    return hour >= startHour && hour < endHour;
                });
                
                if (!hasEvent) {
                    freeSlots++;
                } else {
                    const activeRange = dayRanges.find(range => {
                        const startHour = parseInt(range.start.split(':')[0]);
                        const endHour = parseInt(range.end.split(':')[0]);
                        return hour >= startHour && hour < endHour;
                    });
                    
                    if (activeRange?.status === 'Not Free') busySlots++;
                    else if (activeRange?.status === 'Maybe Free') maybeSlots++;
                    else freeSlots++;
                }
            }
        });
        
        return {
            totalSlots,
            freeSlots,
            busySlots,
            maybeSlots,
            totalEvents,
            freePercentage: Math.round((freeSlots / totalSlots) * 100),
            busyPercentage: Math.round((busySlots / totalSlots) * 100),
            maybePercentage: Math.round((maybeSlots / totalSlots) * 100),
            averageEventsPerDay: Math.round(totalEvents / 7 * 10) / 10
        };
    }, [activeSchedule, processedScheduleData]);

    // Load schedules when component mounts
    useEffect(() => {
        if (!isAuthenticated) return;
        
        const loadSchedules = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const schedulesData = await apiService.getSchedules();
                
                const schedulesObj = {};
                if (Array.isArray(schedulesData)) {
                    schedulesData.forEach(schedule => {
                        const scheduleId = schedule._id || schedule.id;
                        schedulesObj[scheduleId] = {
                            ...schedule,
                            id: scheduleId,
                            lastModified: schedule.lastModified || new Date().toISOString()
                        };
                    });
                }
                
                setSchedules(schedulesObj);
                
                // Set active schedule to most recently used or first one
                const scheduleIds = Object.keys(schedulesObj);
                if (scheduleIds.length > 0) {
                    const mostRecent = scheduleIds.reduce((latest, current) => {
                        return schedulesObj[current].lastModified > schedulesObj[latest].lastModified 
                            ? current : latest;
                    });
                    setActiveScheduleId(mostRecent);
                } else {
                    setShowNewScheduleForm(true);
                }
            } catch (error) {
                console.error('Error loading schedules:', error);
                setError('Failed to load schedules. Please try again.');
                setShowNewScheduleForm(true);
            } finally {
                setLoading(false);
            }
        };

        loadSchedules();
    }, [isAuthenticated]);

    // Auto-save functionality with better error handling
    useEffect(() => {
        if (!activeScheduleId || !activeSchedule || loading || saving) return;
        
        const autoSave = async () => {
            try {
                await apiService.updateSchedule(activeScheduleId, {
                    name: schedules[activeScheduleId]?.name,
                    schedule: activeSchedule,
                    lastModified: new Date().toISOString()
                });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Auto-save failed:', error);
                // Don't show error for auto-save failures to avoid spam
                // User will see errors when they manually save
            }
        };

        const timeoutId = setTimeout(autoSave, 3000); // Auto-save after 3 seconds of inactivity
        return () => clearTimeout(timeoutId);
    }, [activeSchedule, activeScheduleId, loading, saving]); // Remove schedules from deps to prevent excessive re-renders

    // Enhanced event handlers with validation and optimization
    const updateSchedule = useCallback(async (newSchedule, options = {}) => {
        const { skipSave = false, showSuccess = true } = options;
        
        // Update local state immediately for responsive UI
        setSchedules(prev => ({
            ...prev,
            [activeScheduleId]: {
                ...prev[activeScheduleId],
                schedule: newSchedule,
                lastModified: new Date().toISOString()
            }
        }));

        if (!skipSave) {
            try {
                setSaving(true);
                setError(null); // Clear any existing errors
                
                await apiService.updateSchedule(activeScheduleId, {
                    name: schedules[activeScheduleId]?.name,
                    schedule: newSchedule,
                    lastModified: new Date().toISOString()
                });
                
                setLastSaved(new Date());
                if (showSuccess) {
                    setError('✅ Schedule saved successfully!');
                    setTimeout(() => setError(null), 3000);
                }
            } catch (error) {
                console.error('Error saving schedule:', error);
                
                let errorMessage = '❌ Failed to save schedule changes';
                if (error.response?.status === 400) {
                    errorMessage = '❌ Invalid schedule data. Please check your entries';
                } else if (error.response?.status === 401) {
                    errorMessage = '❌ Authentication expired. Please log in again';
                } else if (error.response?.status === 404) {
                    errorMessage = '❌ Schedule not found. It may have been deleted';
                } else if (error.response?.status === 500) {
                    errorMessage = '❌ Server error. Please try again later';
                }
                
                setError(errorMessage);
                
                // Revert the local state change on error
                setSchedules(prev => ({
                    ...prev,
                    [activeScheduleId]: {
                        ...prev[activeScheduleId],
                        schedule: activeSchedule, // Revert to previous state
                    }
                }));
            } finally {
                setSaving(false);
            }
        }
    }, [activeScheduleId, schedules]);

    const handleAddTimeRange = useCallback(async (day, e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const startTime = formData.get('startTime');
        const endTime = formData.get('endTime');
        const status = formData.get('status');
        const title = formData.get('title') || 'Untitled Event';

        // Enhanced validation
        if (!startTime || !endTime) {
            setError('⚠️ Please enter both start and end times');
            return;
        }

        const timeRange = { start: startTime, end: endTime, status, title };
        if (!validateTimeRange(timeRange)) {
            setError('⚠️ Invalid time range. End time must be after start time.');
            return;
        }

        // Check for conflicts
        const existingRanges = activeSchedule[day]?.timeRanges || [];
        const hasConflict = existingRanges.some(existing => {
            const start1 = new Date(`2000/01/01 ${existing.start}`);
            const end1 = new Date(`2000/01/01 ${existing.end}`);
            const start2 = new Date(`2000/01/01 ${startTime}`);
            const end2 = new Date(`2000/01/01 ${endTime}`);
            return (start1 < end2 && end1 > start2);
        });

        if (hasConflict) {
            const confirm = window.confirm('⚠️ This time range overlaps with an existing event. Add anyway?');
            if (!confirm) return;
        }

        const newTimeRange = {
            ...timeRange,
            id: Date.now() + Math.random(),
            createdAt: new Date().toISOString()
        };
        
        const newSchedule = {
            ...activeSchedule,
            [day]: {
                ...activeSchedule[day],
                timeRanges: [...(activeSchedule[day]?.timeRanges || []), newTimeRange]
            }
        };

        await updateSchedule(newSchedule);
        e.target.reset();
    }, [activeSchedule, updateSchedule]);

    const handleRemoveTimeRange = useCallback(async (day, id) => {
        const newSchedule = {
            ...activeSchedule,
            [day]: {
                ...activeSchedule[day],
                timeRanges: activeSchedule[day].timeRanges.filter(range => range.id !== id)
            }
        };

        await updateSchedule(newSchedule);
    }, [activeSchedule, updateSchedule]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedTimeRanges.size === 0) return;
        
        const confirm = window.confirm(`Delete ${selectedTimeRanges.size} selected time range(s)?`);
        if (!confirm) return;

        const newSchedule = { ...activeSchedule };
        
        DAYS_OF_WEEK.forEach(day => {
            if (newSchedule[day]?.timeRanges) {
                newSchedule[day].timeRanges = newSchedule[day].timeRanges.filter(
                    range => !selectedTimeRanges.has(`${day}-${range.id}`)
                );
            }
        });

        await updateSchedule(newSchedule);
        setSelectedTimeRanges(new Set());
        setBulkEditMode(false);
    }, [selectedTimeRanges, activeSchedule, updateSchedule]);

    const handleSleepSchedule = useCallback(async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const startTime = formData.get('sleepStart');
        const endTime = formData.get('sleepEnd');

        if (!validateTimeRange({ start: startTime, end: endTime, status: 'Not Free' })) {
            setError('⚠️ Invalid sleep schedule times');
            return;
        }

        setSleepSchedule({
            start: startTime,
            end: endTime,
            enabled: true
        });

        // Apply sleep schedule to all days
        const newSchedule = { ...activeSchedule };
        DAYS_OF_WEEK.forEach(day => {
            if (!newSchedule[day]) {
                newSchedule[day] = { timeRanges: [] };
            }
            
            // Remove existing sleep schedules
            newSchedule[day].timeRanges = newSchedule[day].timeRanges
                .filter(range => range.title !== 'Sleep');
            
            // Add new sleep schedule
            newSchedule[day].timeRanges.push({
                title: 'Sleep',
                start: startTime,
                end: endTime,
                status: 'Not Free',
                id: `sleep-${Date.now()}`,
                isSystemGenerated: true
            });
        });

        await updateSchedule(newSchedule);
        e.target.reset();
    }, [activeSchedule, updateSchedule]);

    const handleRemoveSleepSchedule = useCallback(async () => {
        setSleepSchedule({ start: '', end: '', enabled: false });

        const newSchedule = { ...activeSchedule };
        DAYS_OF_WEEK.forEach(day => {
            if (newSchedule[day]?.timeRanges) {
                newSchedule[day].timeRanges = newSchedule[day].timeRanges
                    .filter(range => range.title !== 'Sleep');
            }
        });

        await updateSchedule(newSchedule);
    }, [activeSchedule, updateSchedule]);

    const handleMultiDayEvent = useCallback(async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const title = formData.get('title') || 'Multi-day Event';
        const startTime = formData.get('startTime');
        const endTime = formData.get('endTime');
        const status = formData.get('status');

        const timeRange = { start: startTime, end: endTime, status, title };
        if (!validateTimeRange(timeRange)) {
            setError('⚠️ Invalid time range for multi-day event');
            return;
        }

        const newSchedule = { ...activeSchedule };
        let addedCount = 0;

        Object.entries(selectedDays).forEach(([day, isSelected]) => {
            if (isSelected) {
                if (!newSchedule[day]) {
                    newSchedule[day] = { timeRanges: [] };
                }

                const newTimeRange = {
                    ...timeRange,
                    id: `multiday-${Date.now()}-${Math.random()}`,
                    createdAt: new Date().toISOString(),
                    isMultiDay: true
                };

                // Check for duplicates
                const isDuplicate = newSchedule[day].timeRanges.some(existing =>
                    existing.start === startTime && 
                    existing.end === endTime && 
                    existing.title === title
                );

                if (!isDuplicate) {
                    newSchedule[day].timeRanges.push(newTimeRange);
                    addedCount++;
                }
            }
        });

        if (addedCount > 0) {
            await updateSchedule(newSchedule);
            setError(`✅ Added "${title}" to ${addedCount} day(s)`);
            setTimeout(() => setError(null), 3000);
        }

        e.target.reset();
    }, [selectedDays, activeSchedule, updateSchedule]);

    const handleCreateNewSchedule = useCallback(async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const scheduleName = formData.get('scheduleName');
        const templateType = formData.get('template') || 'custom';

        if (!scheduleName?.trim()) {
            setError('⚠️ Please enter a schedule name');
            return;
        }

        if (scheduleName.trim().length > 50) {
            setError('⚠️ Schedule name must be 50 characters or less');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            
            // Create schedule with template if selected
            let templateSchedule = {};
            if (templateType === 'work-schedule') {
                // Pre-populate work schedule template
                DAYS_OF_WEEK.slice(1, 6).forEach(day => { // Monday to Friday
                    templateSchedule[day] = {
                        timeRanges: [{
                            title: 'Work',
                            start: '09:00',
                            end: '17:00',
                            status: 'Not Free',
                            id: `work-${day}-${Date.now()}`,
                            isSystemGenerated: true
                        }]
                    };
                });
            } else if (templateType === 'study-schedule') {
                // Pre-populate study schedule template
                DAYS_OF_WEEK.slice(1, 6).forEach(day => { // Monday to Friday
                    templateSchedule[day] = {
                        timeRanges: [
                            {
                                title: 'Study Time',
                                start: '09:00',
                                end: '12:00',
                                status: 'Not Free',
                                id: `study-${day}-${Date.now()}`,
                                isSystemGenerated: true
                            },
                            {
                                title: 'Study Break',
                                start: '14:00',
                                end: '17:00',
                                status: 'Not Free',
                                id: `study2-${day}-${Date.now()}`,
                                isSystemGenerated: true
                            }
                        ]
                    };
                });
            }
            
            // Declare variables for use in catch block
            let createdSchedule = null;
            let scheduleId = null;
            
            // First create the schedule with just the name
            createdSchedule = await apiService.createSchedule(scheduleName);
            
            if (!createdSchedule) {
                throw new Error('No schedule data returned from server');
            }
            
            scheduleId = createdSchedule._id || createdSchedule.id;
            
            if (!scheduleId) {
                throw new Error('Schedule created but no ID returned');
            }
            
            // If we have a template, apply it by updating the schedule
            let finalSchedule = createdSchedule;
            if (Object.keys(templateSchedule).length > 0) {
                finalSchedule = await apiService.updateSchedule(scheduleId, {
                    name: scheduleName,
                    schedule: templateSchedule
                });
            }
            
            const scheduleToAdd = {
                ...finalSchedule,
                id: scheduleId,
                lastModified: new Date().toISOString()
            };
            
            setSchedules(prev => ({
                ...prev,
                [scheduleId]: scheduleToAdd
            }));

            setActiveScheduleId(scheduleId);
            setShowNewScheduleForm(false);
            setError(`✅ Schedule "${scheduleName}" created successfully!`);
            setTimeout(() => setError(null), 3000);
            
            e.target.reset();
        } catch (error) {
            console.error('Error creating schedule:', error);
            
            let errorMessage = '❌ Failed to create schedule';
            if (error.response?.status === 400) {
                errorMessage = '❌ Invalid schedule data. Please check your input';
            } else if (error.response?.status === 401) {
                errorMessage = '❌ Please log in again to create schedules';
            } else if (error.response?.status === 500) {
                errorMessage = '❌ Server error. Please try again later';
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }
            
            setError(errorMessage);
            
            // If the schedule was created but template failed, still add it to state
            if (createdSchedule && scheduleId) {
                const scheduleToAdd = {
                    ...createdSchedule,
                    id: scheduleId,
                    lastModified: new Date().toISOString()
                };
                
                setSchedules(prev => ({
                    ...prev,
                    [scheduleId]: scheduleToAdd
                }));
                
                setActiveScheduleId(scheduleId);
                setShowNewScheduleForm(false);
            }
        } finally {
            setSaving(false);
        }
    }, []);

    const handleDeleteSchedule = useCallback(async (scheduleId) => {
        const scheduleName = schedules[scheduleId]?.name;
        const confirm = window.confirm(`Are you sure you want to delete "${scheduleName}"? This action cannot be undone.`);
        if (!confirm) return;

        try {
            setSaving(true);
            await apiService.deleteSchedule(scheduleId);
            
            setSchedules(prev => {
                const newSchedules = { ...prev };
                delete newSchedules[scheduleId];
                return newSchedules;
            });
            
            const remainingIds = Object.keys(schedules).filter(id => id !== scheduleId);
            if (remainingIds.length > 0) {
                setActiveScheduleId(remainingIds[0]);
            } else {
                setActiveScheduleId(null);
                setShowNewScheduleForm(true);
            }
            
            setError(`✅ Schedule "${scheduleName}" deleted successfully`);
            setTimeout(() => setError(null), 3000);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            setError('❌ Failed to delete schedule. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [schedules]);

    // Helper functions
    const formatTimeSlot = useCallback((timeRange) => {
        return `${timeRange.title}: ${formatTimeDisplay(timeRange.start)} - ${formatTimeDisplay(timeRange.end)} (${timeRange.status})`;
    }, []);

    const handleDayToggle = useCallback((day) => {
        setSelectedDays(prev => ({
            ...prev,
            [day]: !prev[day]
        }));
    }, []);

    const handleSwitchSchedule = useCallback((scheduleId) => {
        if (schedules && schedules[scheduleId]) {
            setActiveScheduleId(scheduleId);
            setError(null);
        }
    }, [schedules]);

    // Constants for component operation
    const statusOptions = [STATUS_TYPES.FREE, STATUS_TYPES.MAYBE_FREE, STATUS_TYPES.NOT_FREE];

    // Enhanced component render with modern UI
    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-content">
                    <h1>📅 Schedule Dashboard</h1>
                    <p>Manage your time effectively with powerful scheduling tools</p>
                </div>
                
                {/* Quick stats */}
                {scheduleStatistics && (
                    <div className="quick-stats">
                        <div className="stat-card">
                            <span className="stat-value">{scheduleStatistics.totalEvents}</span>
                            <span className="stat-label">Total Events</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{scheduleStatistics.freePercentage}%</span>
                            <span className="stat-label">Free Time</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{scheduleStatistics.averageEventsPerDay}</span>
                            <span className="stat-label">Avg Events/Day</span>
                        </div>
                    </div>
                )}
            </header>
            
            {/* Loading state */}
            {loading && (
                <div className="loading-section">
                    <div className="loading-card">
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                        </div>
                        <h3>Loading Your Schedules</h3>
                        <p>Getting everything ready for you...</p>
                    </div>
                </div>
            )}
            
            {/* Error/Success notifications */}
            {error && (
                <div className={`notification ${error.includes('✅') ? 'success' : 'error'}`}>
                    <div className="notification-content">
                        <span className="notification-text">{error}</span>
                        <button 
                            className="notification-close" 
                            onClick={() => setError(null)}
                            aria-label="Close notification"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            
            {/* Saving indicator */}
            {saving && (
                <div className="saving-indicator">
                    <div className="saving-content">
                        <div className="saving-spinner"></div>
                        <span>💾 Saving changes...</span>
                    </div>
                </div>
            )}
            
            {/* Last saved indicator */}
            {lastSaved && !saving && (
                <div className="last-saved">
                    <span>✅ Last saved: {lastSaved.toLocaleTimeString()}</span>
                </div>
            )}
            
            {/* Welcome section for new users */}
            {!loading && (!schedules || Object.keys(schedules).length === 0) && (
                <div className="welcome-section">
                    <div className="welcome-content">
                        <div className="welcome-icon">🎯</div>
                        <h2>Welcome to Schedule Management!</h2>
                        <p>Create your first schedule to start organizing your time effectively.</p>
                        
                        <div className="welcome-features">
                            <div className="feature">
                                <span className="feature-icon">📊</span>
                                <span>Visual time tracking</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">🔄</span>
                                <span>Multi-day events</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">😴</span>
                                <span>Sleep schedule management</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">📱</span>
                                <span>Mobile responsive</span>
                            </div>
                        </div>
                        
                        <div className="welcome-actions">
                            <button 
                                className="btn btn-primary btn-large"
                                onClick={() => setShowNewScheduleForm(true)}
                            >
                                🚀 Create Your First Schedule
                            </button>
                            <div className="getting-started">
                                <h4>Getting Started:</h4>
                                <ol>
                                    <li>Create a schedule using the button above</li>
                                    <li>Add time blocks by clicking days in Week View</li>
                                    <li>Mark yourself as Free, Busy, or Maybe Free</li>
                                    <li>Share with friends to coordinate hangouts!</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main content */}
            {!loading && schedules && Object.keys(schedules).length > 0 && (
                <div className="main-content">
                    {/* Schedule Management Section */}
                    <section className="schedule-management-section">
                        <div className="section-header">
                            <h2>📋 Schedule Management</h2>
                            <div className="section-actions">
                                <button 
                                    className={`view-toggle ${activeView === 'summary' ? 'active' : ''}`}
                                    onClick={() => setActiveView('summary')}
                                    title="View schedule summary and statistics"
                                >
                                    📊 Summary
                                </button>
                                <button 
                                    className={`view-toggle ${activeView === 'week' ? 'active' : ''}`}
                                    onClick={() => setActiveView('week')}
                                    title="View full week schedule"
                                >
                                    📅 Week View
                                </button>
                                <button 
                                    className={`view-toggle ${activeView === 'day' ? 'active' : ''}`}
                                    onClick={() => setActiveView('day')}
                                    title="Focus on single day"
                                >
                                    📆 Day View
                                </button>
                            </div>
                        </div>
                        
                        <div className="schedule-controls">
                            <div className="primary-controls">
                                <div className="schedule-selector">
                                    <label htmlFor="schedule-select">Active Schedule:</label>
                                    <select 
                                        id="schedule-select"
                                        value={activeScheduleId || ''}
                                        onChange={(e) => handleSwitchSchedule(e.target.value)}
                                        className="schedule-select"
                                    >
                                        {Object.entries(schedules).map(([id, schedule]) => (
                                            <option key={id} value={id}>
                                                {schedule.name} {schedule.lastModified && `(${new Date(schedule.lastModified).toLocaleDateString()})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="action-buttons">
                                    <button 
                                        onClick={() => setShowNewScheduleForm(true)}
                                        className="btn btn-primary"
                                        title="Create a new schedule"
                                    >
                                        ➕ New Schedule
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteSchedule(activeScheduleId)}
                                        className="btn btn-danger"
                                        title="Delete current schedule"
                                        disabled={Object.keys(schedules).length <= 1}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                            
                            <div className="secondary-controls">
                                <button 
                                    className={`btn btn-outline ${showAdvancedTools ? 'active' : ''}`}
                                    onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                                    title="Toggle advanced editing tools"
                                >
                                    ⚙️ Advanced Tools
                                </button>
                                
                                {showAdvancedTools && (
                                    <div className="advanced-controls">
                                        <button 
                                            className={`btn btn-outline ${bulkEditMode ? 'active' : ''}`}
                                            onClick={() => setBulkEditMode(!bulkEditMode)}
                                            title="Select multiple events for bulk operations"
                                        >
                                            ☑️ Bulk Edit
                                        </button>
                                        {bulkEditMode && selectedTimeRanges.size > 0 && (
                                            <button 
                                                className="btn btn-danger"
                                                onClick={handleBulkDelete}
                                                title={`Delete ${selectedTimeRanges.size} selected items`}
                                            >
                                                🗑️ Delete Selected ({selectedTimeRanges.size})
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* New Schedule Form */}
                    {showNewScheduleForm && (
                        <section className="new-schedule-section">
                            <div className="form-container">
                                <h3>Create New Schedule</h3>
                                <form onSubmit={handleCreateNewSchedule} className="new-schedule-form">
                                    <div className="form-group">
                                        <label htmlFor="scheduleName">Schedule Name:</label>
                                        <input
                                            type="text"
                                            id="scheduleName"
                                            name="scheduleName"
                                            placeholder="e.g., Work Schedule, Personal, Weekend..."
                                            required
                                            autoFocus
                                            className="form-input"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="template">Template:</label>
                                        <select name="template" id="template" className="form-select">
                                            {scheduleTemplates.map(template => {
                                                const value = template.name.toLowerCase().replace(/\s+/g, '-');
                                                return (
                                                    <option key={value} value={value}>
                                                        {template.name} - {template.description}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? '⏳ Creating...' : '✅ Create Schedule'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewScheduleForm(false)}
                                            className="btn btn-outline"
                                        >
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    {/* Summary View */}
                    {activeView === 'summary' && scheduleStatistics && (
                        <section className="summary-section">
                            <h3>📊 Schedule Analytics</h3>
                            
                            <div className="stats-grid">
                                <div className="stat-card large free">
                                    <div className="stat-header">
                                        <span className="stat-icon">🟢</span>
                                        <span className="stat-title">Free Time</span>
                                    </div>
                                    <div className="stat-value">{scheduleStatistics.freePercentage}%</div>
                                    <div className="stat-detail">{scheduleStatistics.freeSlots} out of {scheduleStatistics.totalSlots} time slots</div>
                                </div>
                                
                                <div className="stat-card large busy">
                                    <div className="stat-header">
                                        <span className="stat-icon">🔴</span>
                                        <span className="stat-title">Busy Time</span>
                                    </div>
                                    <div className="stat-value">{scheduleStatistics.busyPercentage}%</div>
                                    <div className="stat-detail">{scheduleStatistics.busySlots} scheduled time slots</div>
                                </div>
                                
                                <div className="stat-card large maybe">
                                    <div className="stat-header">
                                        <span className="stat-icon">🟡</span>
                                        <span className="stat-title">Maybe Free</span>
                                    </div>
                                    <div className="stat-value">{scheduleStatistics.maybePercentage}%</div>
                                    <div className="stat-detail">{scheduleStatistics.maybeSlots} tentative slots</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-icon">📅</span>
                                        <span className="stat-title">Total Events</span>
                                    </div>
                                    <div className="stat-value">{scheduleStatistics.totalEvents}</div>
                                    <div className="stat-detail">Across all days</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-icon">📊</span>
                                        <span className="stat-title">Daily Average</span>
                                    </div>
                                    <div className="stat-value">{scheduleStatistics.averageEventsPerDay}</div>
                                    <div className="stat-detail">Events per day</div>
                                </div>
                            </div>
                            
                            {/* Schedule conflicts analysis */}
                            <div className="conflicts-analysis">
                                <h4>⚠️ Schedule Analysis</h4>
                                {(() => {
                                    const conflicts = findScheduleConflicts([{
                                        name: schedules[activeScheduleId]?.name || 'Current Schedule',
                                        schedule: activeSchedule,
                                        ownerName: user?.username || 'You'
                                    }]);
                                    
                                    return conflicts.length > 0 ? (
                                        <div className="conflicts-found">
                                            <p>Found {conflicts.reduce((sum, day) => sum + day.conflicts.length, 0)} potential conflicts in your schedule.</p>
                                            {conflicts.map(({ day, conflicts: dayConflicts }) => (
                                                <div key={day} className="day-conflicts">
                                                    <strong>{day}:</strong> {dayConflicts.length} overlapping events
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-conflicts">
                                            <p>✅ No scheduling conflicts detected!</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>
                    )}

                    {/* Day View */}
                    {activeView === 'day' && (
                        <section className="day-view-section">
                            <div className="day-view-header">
                                <h3>📆 Day Focus: {selectedDay}</h3>
                                <div className="day-selector">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day}
                                            className={`day-btn ${selectedDay === day ? 'active' : ''}`}
                                            onClick={() => setSelectedDay(day)}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="day-content">
                                <div className="day-filters">
                                    <div className="search-filter">
                                        <input
                                            type="text"
                                            placeholder="🔍 Search events..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="search-input"
                                        />
                                    </div>
                                    <div className="status-filter">
                                        <select 
                                            value={filterStatus} 
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="free">Free</option>
                                            <option value="maybe-free">Maybe Free</option>
                                            <option value="not-free">Not Free</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="day-events">
                                    {filteredTimeRanges.length > 0 ? (
                                        filteredTimeRanges.map(range => (
                                            <div key={range.id} className={`event-card ${range.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                <div className="event-header">
                                                    {bulkEditMode && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTimeRanges.has(`${selectedDay}-${range.id}`)}
                                                            onChange={(e) => {
                                                                const key = `${selectedDay}-${range.id}`;
                                                                setSelectedTimeRanges(prev => {
                                                                    const newSet = new Set(prev);
                                                                    if (e.target.checked) {
                                                                        newSet.add(key);
                                                                    } else {
                                                                        newSet.delete(key);
                                                                    }
                                                                    return newSet;
                                                                });
                                                            }}
                                                            className="bulk-checkbox"
                                                        />
                                                    )}
                                                    <h4 className="event-title">{range.title}</h4>
                                                    <button 
                                                        onClick={() => handleRemoveTimeRange(selectedDay, range.id)}
                                                        className="remove-btn"
                                                        title="Remove this event"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="event-details">
                                                    <span className="event-time">
                                                        ⏰ {formatTimeDisplay(range.start)} - {formatTimeDisplay(range.end)}
                                                    </span>
                                                    <span className={`event-status ${range.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {range.status}
                                                    </span>
                                                </div>
                                                {range.createdAt && (
                                                    <div className="event-meta">
                                                        <span className="created-at">
                                                            Created: {new Date(range.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-events">
                                            <div className="no-events-icon">📅</div>
                                            <p>No events found for {selectedDay}</p>
                                            {searchQuery && <p>Try adjusting your search or filter.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Week View - Enhanced schedule components */}
                    {activeView === 'week' && activeScheduleId && activeSchedule && (
                        <section className="week-view-section">
                            <div className="schedule-tools">
                                <SleepSchedule
                                    sleepSchedule={sleepSchedule}
                                    handleSleepSchedule={handleSleepSchedule}
                                    handleRemoveSleepSchedule={handleRemoveSleepSchedule}
                                    formatTime={formatTimeDisplay}
                                />

                                <MultiDayEvent
                                    selectedDays={selectedDays}
                                    handleMultiDayEvent={handleMultiDayEvent}
                                    handleDayToggle={handleDayToggle}
                                    statusOptions={statusOptions}
                                />
                            </div>

                            <div className="week-schedule">
                                {Object.entries(activeSchedule).map(([day, { timeRanges }]) => (
                                    <DaySchedule
                                        key={day}
                                        day={day}
                                        timeRanges={timeRanges}
                                        handleAddTimeRange={handleAddTimeRange}
                                        handleRemoveTimeRange={handleRemoveTimeRange}
                                        formatTimeSlot={formatTimeSlot}
                                        statusOptions={statusOptions}
                                        bulkEditMode={bulkEditMode}
                                        selectedTimeRanges={selectedTimeRanges}
                                        onTimeRangeSelect={(dayRangeId, selected) => {
                                            setSelectedTimeRanges(prev => {
                                                const newSet = new Set(prev);
                                                if (selected) {
                                                    newSet.add(dayRangeId);
                                                } else {
                                                    newSet.delete(dayRangeId);
                                                }
                                                return newSet;
                                            });
                                        }}
                                    />
                                ))}
                            </div>

                            <HourlySchedule 
                                schedule={activeSchedule} 
                                className="home-view enhanced"
                                showTimeLabels={true}
                                interactive={true}
                            />
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default Home;