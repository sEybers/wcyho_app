import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.js';
import '../css/Settings.css';

function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userSettings, setUserSettings] = useState(null);
    const [availableSchedules, setAvailableSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState('');

    useEffect(() => {
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiService.getUserSettings();
            setUserSettings(response.user);
            setAvailableSchedules(response.availableSchedules);
            setSelectedScheduleId(response.user.primarySchedule?._id || '');
        } catch (error) {
            console.error('Error loading user settings:', error);
            setError('Failed to load user settings');
        } finally {
            setLoading(false);
        }
    };

    const handlePrimaryScheduleChange = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await apiService.updatePrimarySchedule(selectedScheduleId);
            setUserSettings(response.user);
            setSuccess('Primary schedule updated successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error updating primary schedule:', error);
            setError('Failed to update primary schedule');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-container">
                <div className="loading">
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <h1 className="page-header">Account Settings</h1>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            {success && (
                <div className="success-message">
                    <p>{success}</p>
                </div>
            )}

            {userSettings && (
                <div className="settings-content">
                    {/* User Information Section */}
                    <div className="settings-section">
                        <h2>Account Information</h2>
                        <div className="user-info">
                            <div className="info-item">
                                <label>Username:</label>
                                <span>{userSettings.username}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{userSettings.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Role:</label>
                                <span>{userSettings.role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Primary Schedule Section */}
                    <div className="settings-section">
                        <h2>Primary Schedule</h2>
                        <div className="schedule-settings">
                            <p className="section-description">
                                Select your primary schedule that will be used for comparisons and shared with friends.
                                This schedule will represent your availability when others want to plan hangouts.
                            </p>
                            
                            <div className="schedule-selector">
                                <label htmlFor="primary-schedule">Choose Primary Schedule:</label>
                                <select
                                    id="primary-schedule"
                                    value={selectedScheduleId}
                                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                                    className="schedule-select"
                                >
                                    <option value="">No primary schedule selected</option>
                                    {availableSchedules.map(schedule => (
                                        <option key={schedule._id} value={schedule._id}>
                                            {schedule.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="current-primary">
                                <strong>Current Primary Schedule: </strong>
                                {userSettings.primarySchedule ? (
                                    <span className="schedule-name">{userSettings.primarySchedule.name}</span>
                                ) : (
                                    <span className="no-schedule">None selected</span>
                                )}
                            </div>

                            <div className="schedule-actions">
                                <button
                                    onClick={handlePrimaryScheduleChange}
                                    disabled={saving || selectedScheduleId === (userSettings.primarySchedule?._id || '')}
                                    className={`save-btn ${saving ? 'saving' : ''}`}
                                >
                                    {saving ? 'Saving...' : 'Update Primary Schedule'}
                                </button>
                            </div>

                            {availableSchedules.length === 0 && (
                                <div className="no-schedules-message">
                                    <p>You don't have any schedules yet. Create a schedule first to set it as your primary schedule.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="settings-section">
                        <h2>About Primary Schedules</h2>
                        <div className="help-content">
                            <ul>
                                <li>Your primary schedule is the one that will be used when friends want to compare schedules with you</li>
                                <li>You can change your primary schedule at any time</li>
                                <li>Only schedules you've created will appear in the selection</li>
                                <li>If you don't set a primary schedule, others won't be able to compare with your availability</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
