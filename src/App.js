import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import NavBar from './components/layout/NavBar';
import Dashboard from './components/pages/Dashboard';
import OrgChartPage from './components/pages/OrgChartPage';
import TimeGraphPage from './components/pages/TimeGraphPage';
import UnitDetails from './components/pages/UnitDetails';
import TestPage from './components/pages/TestPage';
import ArrowChartPage from './components/pages/ArrowChartPage';
import GroupChartPage from './components/pages/GroupChartPage';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="d-flex flex-column vh-100 bg-light">
          <NavBar />
            <main className="flex-grow-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard/>} />
              <Route path="/group-chart" element={<GroupChartPage/>} />
              <Route path="/arrow-chart" element={<ArrowChartPage/>} />
              <Route path="/org-chart" element={<OrgChartPage />} />
              <Route path="/time-graph" element={<TimeGraphPage />} />
              {/* <Route path="/time-graph" element={<TestPage />} /> */}
              <Route path="/unit/:id" element={<UnitDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;