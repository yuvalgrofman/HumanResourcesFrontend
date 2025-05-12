import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UnitDetails from './pages/UnitDetails';
import './App.css';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="app">
          <Header />
          <div className="app-container">
            <Sidebar />
            <main className="content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/unit/:unitId" element={<UnitDetails />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;