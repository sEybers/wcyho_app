import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../services/api.js';
import { 
    validateTimeRange, 
    formatTimeDisplay, 
    mergeTimeRanges,
    DAYS_OF_WEEK,
    STATUS_TYPES 
} from '../utils/timeUtils.js';

// Sub-components for better organization
import ScheduleHeader from '../components/Home/ScheduleHeader.jsx';
import ScheduleManager from '../components/Home/ScheduleManager.jsx';
import ScheduleEditor from '../components/Home/ScheduleEditor.jsx';
import ScheduleStats from '../components/Home/ScheduleStats.jsx';
import WelcomeScreen from '../components/Home/WelcomeScreen.jsx';
import LoadingScreen from '../components/Home/LoadingScreen.jsx';
import ErrorBoundary from '../components/Common/ErrorBoundary.jsx';

import '../css/Home_new.css';

/**
 * Redesigned Home Component - Robust Schedule Management Dashboard
 * 
 * Features:
 * - Clean separation of concerns with sub-components
 * - Robust error handling and validation
 * - Optimized performance with proper memoization
 * - Better user experience with loading states
 * - Modular architecture for maintainability
 */
function Home() {
    const { user, isAuthenticated } = useAuth();
    
    // Core state management
    const [state, setState] = useState({
        schedules: {},
        activeScheduleId: null,
        loading: true,
        saving: false,
        error: null,
        lastSaved: null
    });
    
    // UI state
    const [uiState, setUiState] = useState({
        activeView: 'overview', // 'overview', 'editor', 'stats'
        showNewScheduleForm: false,
        selectedDay: 'Monday',
        searchQuery: '',
        filterStatus: 'all'
    });
    
    // Performance optimization refs
    const saveTimeoutRef = useRef(null);
    const lastSaveAttempt = useRef(null);
    
    // Memoized computed values
    const activeSchedule = useMemo(() => {
        if (!state.activeScheduleId || !state.schedules[state.activeScheduleId]) {
            return null;
        }
        return state.schedules[state.activeScheduleId];
    }, [state.activeScheduleId, state.schedules]);
    
    const scheduleData = useMemo(() => {
        if (!activeSchedule?.schedule) return {};
        
        const processed = {};
        DAYS_OF_WEEK.forEach(day => {
            const dayData = activeSchedule.schedule[day];
            if (dayData?.timeRanges) {
                processed[day] = mergeTimeRanges(dayData.timeRanges);
            } else {
                processed[day] = [];
            }
        });
        
        return processed;
    }, [activeSchedule]);
    
    const scheduleStats = useMemo(() => {
        if (!scheduleData || Object.keys(scheduleData).length === 0) return null;
        
        let totalSlots = 0;
        let freeSlots = 0;
        let busySlots = 0;
        let maybeSlots = 0;
        let totalEvents = 0;
        
        DAYS_OF_WEEK.forEach(day => {
            const dayRanges = scheduleData[day] || [];
            totalEvents += dayRanges.length;
            
            // Calculate hourly availability (simplified)
            for (let hour = 0; hour < 24; hour++) {
                totalSlots++;
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                
                const activeRange = dayRanges.find(range => {
                    const startHour = parseInt(range.start.split(':')[0]);
                    const endHour = parseInt(range.end.split(':')[0]);
                    return hour >= startHour && hour < endHour;
                });
                
                if (!activeRange) {
                    freeSlots++;
                } else if (activeRange.status === 'Not Free') {
                    busySlots++;
                } else if (activeRange.status === 'Maybe Free') {
                    maybeSlots++;
                } else {
                    freeSlots++;
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
            averageEventsPerDay: Math.round((totalEvents / 7) * 10) / 10
        };
    }, [scheduleData]);
    
    // Core data operations
    const loadSchedules = useCallback(async () => {
        if (!isAuthenticated) return;
        
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            
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
            
            setState(prev => ({
                ...prev,
                schedules: schedulesObj,
                loading: false
            }));
            
            // Set active schedule if none selected
            const scheduleIds = Object.keys(schedulesObj);
            if (scheduleIds.length > 0 && !state.activeScheduleId) {
                const mostRecent = scheduleIds.reduce((latest, current) => {
                    return schedulesObj[current].lastModified > schedulesObj[latest].lastModified 
                        ? current : latest;
                });
                setState(prev => ({ ...prev, activeScheduleId: mostRecent }));
            }
            
        } catch (error) {
            console.error('Error loading schedules:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load schedules. Please refresh the page.'
            }));
        }
    }, [isAuthenticated, state.activeScheduleId]);
    
    const createSchedule = useCallback(async (scheduleName, templateType = 'custom') => {
        if (!scheduleName?.trim()) {
            throw new Error('Schedule name is required');
        }
        
        if (scheduleName.trim().length > 50) {
            throw new Error('Schedule name must be 50 characters or less');
        }
        
        setState(prev => ({ ...prev, saving: true, error: null }));
        
        try {
            // Create the schedule
            const createdSchedule = await apiService.createSchedule(scheduleName.trim());
            
            if (!createdSchedule) {
                throw new Error('No schedule data returned from server');
            }
            
            const scheduleId = createdSchedule._id || createdSchedule.id;
            
            if (!scheduleId) {
                throw new Error('Schedule created but no ID returned');
            }
            
            // Apply template if specified
            let finalSchedule = createdSchedule;
            if (templateType !== 'custom') {
                const templateSchedule = generateTemplate(templateType);
                if (Object.keys(templateSchedule).length > 0) {
                    finalSchedule = await apiService.updateSchedule(scheduleId, {
                        name: scheduleName.trim(),
                        schedule: templateSchedule
                    });
                }
            }
            
            const scheduleToAdd = {
                ...finalSchedule,
                id: scheduleId,
                lastModified: new Date().toISOString()
            };
            
            setState(prev => ({
                ...prev,
                schedules: {
                    ...prev.schedules,
                    [scheduleId]: scheduleToAdd
                },
                activeScheduleId: scheduleId,
                saving: false,
                error: null,
                lastSaved: new Date()
            }));
            
            setUiState(prev => ({ ...prev, showNewScheduleForm: false }));
            
            return scheduleToAdd;
            
        } catch (error) {
            setState(prev => ({
                ...prev,
                saving: false,
                error: `Failed to create schedule: ${error.message}`
            }));
            throw error;
        }
    }, []);
    
    const updateSchedule = useCallback(async (scheduleId, updates) => {
        if (!scheduleId || !updates) {
            throw new Error('Invalid update parameters');
        }
        
        setState(prev => ({ ...prev, saving: true, error: null }));
        
        try {
            const updatedSchedule = await apiService.updateSchedule(scheduleId, {
                ...updates,
                lastModified: new Date().toISOString()
            });
            
            setState(prev => ({
                ...prev,
                schedules: {
                    ...prev.schedules,
                    [scheduleId]: {
                        ...prev.schedules[scheduleId],
                        ...updatedSchedule,
                        id: scheduleId
                    }
                },
                saving: false,
                lastSaved: new Date()
            }));
            
            return updatedSchedule;
            
        } catch (error) {
            setState(prev => ({
                ...prev,
                saving: false,
                error: `Failed to update schedule: ${error.message}`
            }));
            throw error;
        }
    }, []);
    
    const deleteSchedule = useCallback(async (scheduleId) => {
        if (!scheduleId) return;
        
        const scheduleName = state.schedules[scheduleId]?.name;
        const confirmed = window.confirm(
            `Are you sure you want to delete "${scheduleName}"? This action cannot be undone.`
        );
        
        if (!confirmed) return;
        
        setState(prev => ({ ...prev, saving: true, error: null }));
        
        try {
            await apiService.deleteSchedule(scheduleId);
            
            setState(prev => {
                const newSchedules = { ...prev.schedules };
                delete newSchedules[scheduleId];
                
                const remainingIds = Object.keys(newSchedules);
                const newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
                
                return {
                    ...prev,
                    schedules: newSchedules,
                    activeScheduleId: newActiveId,
                    saving: false,
                    lastSaved: new Date()
                };
            });
            
            if (Object.keys(state.schedules).length <= 1) {
                setUiState(prev => ({ ...prev, showNewScheduleForm: true }));
            }
            
        } catch (error) {
            setState(prev => ({
                ...prev,
                saving: false,
                error: `Failed to delete schedule: ${error.message}`
            }));
        }
    }, [state.schedules]);
    
    // Auto-save functionality
    const autoSave = useCallback(async () => {
        if (!state.activeScheduleId || !activeSchedule || state.saving) return;
        
        // Debounce auto-save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await apiService.updateSchedule(state.activeScheduleId, {
                    name: activeSchedule.name,
                    schedule: activeSchedule.schedule,
                    lastModified: new Date().toISOString()
                });
                
                setState(prev => ({ ...prev, lastSaved: new Date() }));
                
            } catch (error) {
                console.warn('Auto-save failed:', error);
                // Don't show error for auto-save failures to avoid spam
            }
        }, 3000);
    }, [state.activeScheduleId, activeSchedule, state.saving]);
    
    // Template generation
    const generateTemplate = useCallback((templateType) => {
        const templates = {
            'work-schedule': () => {
                const template = {};
                DAYS_OF_WEEK.slice(1, 6).forEach(day => { // Monday to Friday
                    template[day] = {
                        timeRanges: [{
                            title: 'Work',
                            start: '09:00',
                            end: '17:00',
                            status: 'Not Free'
                        }]
                    };
                });
                return template;
            },
            'study-schedule': () => {
                const template = {};
                DAYS_OF_WEEK.slice(1, 6).forEach(day => {
                    template[day] = {
                        timeRanges: [
                            {
                                title: 'Morning Study',
                                start: '09:00',
                                end: '12:00',
                                status: 'Not Free'
                            },
                            {
                                title: 'Afternoon Study',
                                start: '14:00',
                                end: '17:00',
                                status: 'Not Free'
                            }
                        ]
                    };
                });
                return template;
            },
            'weekend-schedule': () => {
                const template = {};
                ['Saturday', 'Sunday'].forEach(day => {
                    template[day] = {
                        timeRanges: [{
                            title: 'Free Time',
                            start: '10:00',
                            end: '18:00',
                            status: 'Free'
                        }]
                    };
                });
                return template;
            }
        };
        
        return templates[templateType] ? templates[templateType]() : {};
    }, []);
    
    // Event handlers
    const handleScheduleSelect = useCallback((scheduleId) => {
        setState(prev => ({ ...prev, activeScheduleId: scheduleId }));
    }, []);
    
    const handleViewChange = useCallback((view) => {
        setUiState(prev => ({ ...prev, activeView: view }));
    }, []);
    
    const handleErrorDismiss = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);
    
    // Effects
    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);
    
    useEffect(() => {
        autoSave();
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [autoSave]);
    
    // Render logic
    if (!isAuthenticated) {
        return (
            <div className="home-container">
                <div className="auth-required">
                    <h2>Please log in to access your schedules</h2>
                </div>
            </div>
        );
    }
    
    if (state.loading) {
        return <LoadingScreen />;
    }
    
    if (Object.keys(state.schedules).length === 0) {
        return (
            <WelcomeScreen 
                onCreateSchedule={() => setUiState(prev => ({ ...prev, showNewScheduleForm: true }))}
                showNewScheduleForm={uiState.showNewScheduleForm}
                onCloseForm={() => setUiState(prev => ({ ...prev, showNewScheduleForm: false }))}
                onSubmitSchedule={createSchedule}
                saving={state.saving}
                error={state.error}
                onErrorDismiss={handleErrorDismiss}
            />
        );
    }
    
    return (
        <ErrorBoundary>
            <div className="home-container">
                <ScheduleHeader 
                    user={user}
                    scheduleStats={scheduleStats}
                    lastSaved={state.lastSaved}
                    saving={state.saving}
                />
                
                <div className="main-content">
                    <ScheduleManager
                        schedules={state.schedules}
                        activeScheduleId={state.activeScheduleId}
                        activeView={uiState.activeView}
                        onScheduleSelect={handleScheduleSelect}
                        onViewChange={handleViewChange}
                        onCreateSchedule={() => setUiState(prev => ({ ...prev, showNewScheduleForm: true }))}
                        onDeleteSchedule={deleteSchedule}
                        showNewScheduleForm={uiState.showNewScheduleForm}
                        onCloseForm={() => setUiState(prev => ({ ...prev, showNewScheduleForm: false }))}
                        onSubmitSchedule={createSchedule}
                        saving={state.saving}
                        error={state.error}
                        onErrorDismiss={handleErrorDismiss}
                    />
                    
                    {uiState.activeView === 'editor' && activeSchedule && (
                        <ScheduleEditor
                            schedule={activeSchedule}
                            scheduleData={scheduleData}
                            selectedDay={uiState.selectedDay}
                            searchQuery={uiState.searchQuery}
                            filterStatus={uiState.filterStatus}
                            onScheduleUpdate={(updates) => updateSchedule(state.activeScheduleId, updates)}
                            onDaySelect={(day) => setUiState(prev => ({ ...prev, selectedDay: day }))}
                            onSearchChange={(query) => setUiState(prev => ({ ...prev, searchQuery: query }))}
                            onFilterChange={(filter) => setUiState(prev => ({ ...prev, filterStatus: filter }))}
                            saving={state.saving}
                        />
                    )}
                    
                    {uiState.activeView === 'stats' && scheduleStats && (
                        <ScheduleStats 
                            stats={scheduleStats}
                            scheduleData={scheduleData}
                            schedule={activeSchedule}
                        />
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default Home;
