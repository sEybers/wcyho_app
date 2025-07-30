import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../css/UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // In a real app, you'd fetch users from the backend
        const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
        setUsers(Object.values(allUsers));
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  const handleDeleteUser = (userId) => {
    // Original localStorage-based implementation
    const updatedUsers = { ...JSON.parse(localStorage.getItem('users')) };
    const userEmail = users.find(user => user.id === userId)?.email;
    
    if (userEmail && updatedUsers[userEmail]) {
      delete updatedUsers[userEmail];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(Object.values(updatedUsers));
    }
  };
  
  if (loading) {
    return <div className="loading">Loading users...</div>;
  }
  
  return (
    <div className="user-management">
      <h1>User Management</h1>
      <div className="users-list">
        {users.map(user => (
          <div key={user.id} className="user-item">
            <div>
              <h3>{user.username}</h3>
              <p>{user.email}</p>
              <p className="user-role">Role: {user.role}</p>
            </div>
            <button 
              onClick={() => handleDeleteUser(user.id)}
              disabled={user.id === apiService.getCurrentUser()?.id} // Can't delete yourself
            >
              Delete User
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManagement;