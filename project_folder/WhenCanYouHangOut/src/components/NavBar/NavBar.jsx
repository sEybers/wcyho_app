import React from 'react';
import { Link } from 'react-router-dom';
import '../../css/NavBar.css';

const NavBar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    When Can You Hang Out?
                </Link>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <Link to="/" className="nav-link">
                            Home
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/weekly" className="nav-link">
                            Weekly View
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/friends" className="nav-link">
                            Friends
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;