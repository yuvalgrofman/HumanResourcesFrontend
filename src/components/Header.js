import React from 'react';
import { Link } from 'react-router-dom';
import DateSelector from './DateSelector';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          Army HR Visualization
        </Link>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Dashboard</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="header-right">
        <DateSelector />
      </div>
    </header>
  );
};

export default Header;