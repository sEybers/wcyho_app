import React, { useState, useEffect } from 'react';


function UserManagement() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // Load all users
    const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
    setUsers(Object.values(allUsers));
  }, []);
  
  const handleDeleteUser = (userId) => {
    // Delete user implementation
    const updatedUsers = { ...JSON.parse(localStorage.getItem('users')) };
    const userEmail = users.find(user => user.id === userId)?.email;
    
    if (userEmail && updatedUsers[userEmail]) {
      delete updatedUsers[userEmail];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(Object.values(updatedUsers));
    }
  };
  
  return (
    <div className="user-management">
      <h1>User Management</h1>
      <div className="users-list">
        {users.map(user => (
          <div key={user.id} className="user-item">
            <div>
              <h3>{user.username}</h3>
              <p>{user.email}</p>
            </div>
            <button onClick={() => handleDeleteUser(user.id)}>Delete User</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManagement;