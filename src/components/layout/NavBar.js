import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import "./NavBar.css";
import { useNavigate } from "react-router";

const NavBar = () => {
  const navigate = useNavigate();
  const { handleDateChange } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/unit/${searchTerm}`);
  };

  const handleDateSelection = (e) => {
    handleDateChange(e.target.value);
  };

  return (
    <nav>
      <div className="container mx-auto flex justify-between flex-wrap relative">
        {/* Left side: Logo and navigation links */}
        <div className="flex items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            {/* <svg
              className="h-2 w-2 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg> */}
            <span className="font-bold text-xl">Army HR Visualizer</span>
          </Link>
          {/* Navigation Links */}
          <div className="flex items-center ml-6">
            <Link
              to="/"
              className={`px-4 py-2 mr-2 rounded hover:bg-gray-700 ${
                location.pathname === '/' ? 'bg-gray-700' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/group-chart"
              className={`px-4 py-2 mr-2 rounded hover:bg-gray-700 ${
                location.pathname === '/org-chart' ? 'bg-gray-700' : ''
              }`}
            >
              Group Chart
            </Link>
            <Link
              to="/arrow-chart"
              className={`px-4 py-2 mr-2 rounded hover:bg-gray-700 ${
                location.pathname === '/org-chart' ? 'bg-gray-700' : ''
              }`}
            >
              Arrow Chart
            </Link>
            <Link
              to="/org-chart"
              className={`px-4 py-2 mr-2 rounded hover:bg-gray-700 ${
                location.pathname === '/org-chart' ? 'bg-gray-700' : ''
              }`}
            >
              Org Chart
            </Link>
            <Link
              to="/time-graph"
              className={`px-4 py-2 mr-2 rounded hover:bg-gray-700 ${
                location.pathname === '/time-graph' ? 'bg-gray-700' : ''
              }`}
            >
              Time Graph
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
