import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { testSchedules } from '../../utils/testData';
import '../../css/Auth.css';

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            console.log('Submitting credentials:', { email: credentials.email });
            const data = await (isLogin 
                ? apiService.login(credentials)
                : apiService.register({
                    ...credentials,
                    username: formData.get('username')
                  }));
            onLogin(data);
        } catch (error) {
            console.error('Auth error:', error);
            setError(`Authentication failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Add dev login handler
    const handleDevLogin = () => {
        const devUser = {
            userId: 'dev-123',
            username: 'Test User',
            email: 'test@example.com',
            schedules: testSchedules
        };
        onLogin(devUser);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        required={!isLogin}
                    />
                    {!isLogin && (
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                        />
                    )}
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                {error && <div className="error-message">{error}</div>}
                <button 
                    className="switch-auth-btn"
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
                </button>

                {/* Add development mode button */}
                {import.meta.env.DEV && (
                    <button 
                        type="button"
                        onClick={handleDevLogin}
                        className="dev-bypass-btn"
                    >
                        Use Test Schedules
                    </button>
                )}
            </div>
        </div>
    );
};

export default Auth;