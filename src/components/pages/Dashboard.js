import "./Dashboard.css"; // Assuming you have some CSS for styling
import React from 'react';
import { useData } from '../../context/DataContext';
import OrgChart from '../visualizations/OrgChart';
import TimeGraph from '../visualizations/TimeGraph';
import ControlPanel from '../layout/ControlPanel';
import DataPanel from '../layout/DataPanel';

const Dashboard = () => {
  const { units, selectedDate } = useData();
  
  return (
    <div className="dashboard">
      {/* Control Panel */}
      <ControlPanel title="Dashboard Filters" />
      
      {/* Main Content Area */}
      <div className="main">
        <h1 className="text-2xl font-bold mb-6">Army HR Dashboard - {selectedDate}</h1>
        
        {/* Statistics Overview */}
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Regular Soldiers</h3>
            <p>{countRegularSoldiers(units)}</p>
          </div>
          <div className="stats-card">
            <h3>Regular Officers</h3>
            <p>{countOfficers(units)}</p>
          </div>
          <div className="stats-card">
            <h3>Senior Officers</h3>
            <p>{countSeniorOfficers(units)}</p>
          </div>
          <div className="stats-card">
            <h3>Total Units</h3>
            <p>{countAllUnits(units)}</p>
          </div>
          <div className="stats-card">
            <h3>Total Personnel</h3>
            <p>{sumTotalPersonnel(units)}</p>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="section">
          <h2 className="text-xl font-semibold mb-3">Organizational Structure</h2>
          <div className="bg-white p-4 rounded shadow h-64">
            <OrgChart />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const countAllUnits = (units) => {
  if (!units || units.length === 0) return 0;
  
  let count = 0;
  
  const countUnits = (unitsList) => {
    count += unitsList.length;
    
    unitsList.forEach(unit => {
      if (unit.sub_units && unit.sub_units.length > 0) {
        countUnits(unit.sub_units);
      }
    });
  };
  
  countUnits(units);
  return count;
};

const sumTotalPersonnel = (units) => {
  if (!units || units.length === 0) return 0;
  
  let total = 0;
  
  const sumPersonnel = (unitsList) => {
    unitsList.forEach(unit => {
      total += unit.total_personnel || 0;
      
      if (unit.sub_units && unit.sub_units.length > 0) {
        sumPersonnel(unit.sub_units);
      }
    });
  };
  
  sumPersonnel(units);
  return total;
};

const countSeniorOfficers = (units) => {
  if (!units || units.length === 0) return 0;
  
  let count = 0;
  
  const countSeniorOfficersRec = (unitsList) => {
    unitsList.forEach(unit => {
      count += unit.senior_officers || 0;
      
      if (unit.sub_units && unit.sub_units.length > 0) {
        countSeniorOfficersRec(unit.sub_units);
      }
    });
  };
  
  countSeniorOfficersRec(units);
  return count;
};

const countOfficers = (units) => {
  if (!units || units.length === 0) return 0;
  
  let count = 0;
  
  const countOfficersRec = (unitsList) => {
    unitsList.forEach(unit => {
      count += unit.officers || 0;
      
      if (unit.sub_units && unit.sub_units.length > 0) {
        countOfficersRec(unit.sub_units);
      }
    });
  };
  
  countOfficersRec(units);
  return count;
};

const countRegularSoldiers = (units) => {
  if (!units || units.length === 0) return 0;
  
  let count = 0;
  
  const countSoldiers = (unitsList) => {
    unitsList.forEach(unit => {
      count += unit.regular_soldiers || 0;
      
      if (unit.sub_units && unit.sub_units.length > 0) {
        countSoldiers(unit.sub_units);
      }
    });
  };
  
  countSoldiers(units);
  return count;
};

export default Dashboard;
