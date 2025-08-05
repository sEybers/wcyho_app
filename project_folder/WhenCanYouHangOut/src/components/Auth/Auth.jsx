import React, { useState } from 'react';
import { apiService } from '../../services/api.js';
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
            console.log('Attempting login with:', credentials.email);
            
            if (isLogin) {
                // Login
                const userData = await apiService.login(credentials);
                console.log('Login successful:', userData);
                onLogin(userData);
            } else {
                // Register
                const registerData = {
                    ...credentials,
                    username: formData.get('username')
                };
                const userData = await apiService.register(registerData);
                console.log('Registration successful:', userData);
                onLogin(userData);
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>{isLogin ? 'Login' : 'Register'}</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                required
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading}>
                        {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>
                
                <p>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        type="button" 
                        className="link-button"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>

            </div>
        </div>
    );
};

export default Auth;