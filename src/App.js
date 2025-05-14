import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import NavBar from './components/layout/NavBar';
import Dashboard from './components/pages/Dashboard';
import OrgChartPage from './components/pages/OrgChartPage';
import TimeGraphPage from './components/pages/TimeGraphPage';
import UnitDetails from './components/pages/UnitDetails';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="flex flex-col h-screen bg-gray-100">
          <NavBar />
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/org-chart" element={<OrgChartPage />} />
              <Route path="/time-graph" element={<TimeGraphPage />} />
              <Route path="/unit/:id" element={<UnitDetails />} />
            </Routes>
          </div>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;