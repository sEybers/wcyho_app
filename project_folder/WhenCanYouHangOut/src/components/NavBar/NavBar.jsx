import React from 'react';
import { Link } from 'react-router-dom';
import "../../css/NavBar.css";

const NavBar = ({ onLogout, username, userRole }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          When Can You Hang Out?
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/weekly" className="nav-link">Weekly View</Link>
          </li>
          <li className="nav-item">
            <Link to="/compare" className="nav-link">Compare Schedules</Link>
          </li>
          {userRole === 'admin' && (
            <li className="nav-item">
              <Link to="/admin/users" className="nav-link">Manage Users</Link>
            </li>
          )}
          <li className="nav-item nav-right">
            <Link to="/friends" className="nav-link">Friends</Link>
          </li>
          <li className="nav-item">
            <Link to="/settings" className="nav-link">Settings</Link>
          </li>
          <li className="nav-item">
            <span className="username-display">{username}</span>
          </li>
          <li className="nav-item">
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;