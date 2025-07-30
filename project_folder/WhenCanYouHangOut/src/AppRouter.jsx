import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NavBar from './components/NavBar/NavBar';
import Home from './pages/Home';
import WeeklyView from './pages/WeeklyView';
import Compare from './components/CompareSchedules/CompareSchedules.jsx';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import Auth from './components/Auth/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './components/Admin/UserManagement.jsx'

const AppRouter = () => {
  const { user, isAuthenticated, logout, login } = useAuth();

  return (
    <>
      {isAuthenticated && (
        <NavBar 
          onLogout={logout} 
          username={user?.username} 
          userRole={user?.role} 
        />
      )}
      
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Auth onLogin={login} />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="/weekly" element={
          <ProtectedRoute>
            <WeeklyView />
          </ProtectedRoute>
        } />
        
        <Route path="/compare" element={
          <ProtectedRoute>
            <Compare />
          </ProtectedRoute>
        } />
        
        <Route path="/friends" element={
          <ProtectedRoute>
            <Friends userId={user?.id} />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        {user?.role === 'admin' && (
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
        )}
        
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </>
  );
};

export default AppRouter;