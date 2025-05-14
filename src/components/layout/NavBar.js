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
            <Link
              to="/unit/root"
              className={`px-4 py-2 rounded hover:bg-gray-700 ${
                location.pathname.startsWith('/unit/') ? 'bg-gray-700' : ''
              }`}
            >
              Unit Details
            </Link>
          </div>
        </div>
        {/* Right side: Search and date picker */}
        <div className="flex inset-full object-right">
          <form onSubmit={handleSearch} className="flex mr-4">
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 rounded-l text-black"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded-r hover:bg-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>
          <input
            type="date"
            className="px-3 py-1 rounded text-black"
            onChange={handleDateSelection}
            defaultValue={'2024-01-01'}
          />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
