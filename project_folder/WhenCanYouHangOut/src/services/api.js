const API_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify({}));
        }
        if (!localStorage.getItem('schedules')) {
            localStorage.setItem('schedules', JSON.stringify({}));
        }
    }

    async register(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users'));
            
            // Check if user exists
            if (users[userData.email]) {
                throw new Error('User already exists');
            }

            // Create new user
            const userId = Date.now().toString();
            const newUser = {
                id: userId,
                username: userData.username,
                email: userData.email,
                schedules: {}
            };

            users[userData.email] = newUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));

            return newUser;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const users = JSON.parse(localStorage.getItem('users'));
            const user = users[credentials.email];

            if (!user) {
                throw new Error('Invalid credentials');
            }

            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    isAuthenticated() {
        return !!localStorage.getItem('currentUser');
    }
}

export const apiService = new ApiService();
