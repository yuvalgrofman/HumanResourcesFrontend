import React from 'react';
import { useData } from '../contexts/DataContext';
import OrgChart from '../components/OrgChart';
import UnitCard from '../components/UnitCard';
import './Dashboard.css';

const Dashboard = () => {
  const { units, loading, error, selectedDate } = useData();

  if (loading) {
    return <div className="loading-spinner">Loading organization data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const topLevelUnits = units.filter(unit => !unit.parent_unit_id);

  // Calculate total personnel across all units
  const calculateTotalPersonnel = () => {
    let regularSoldiers = 0;
    let officers = 0;
    let seniorOfficers = 0;
    
    const processUnit = (unit) => {
      regularSoldiers += unit.regular_soldiers || 0;
      officers += unit.officers || 0;
      seniorOfficers += unit.senior_officers || 0;
    };
    
    const traverseUnits = (unitsArray) => {
      unitsArray.forEach(unit => {
        processUnit(unit);
      });
    };
    
    traverseUnits(units);
    
    return {
      regularSoldiers,
      officers,
      seniorOfficers,
      total: regularSoldiers + officers + seniorOfficers
    };
  };

  const totalPersonnel = calculateTotalPersonnel();

  return (
    <div className="dashboard">
      <h1 className="page-title">Army HR Dashboard</h1>
      
      <div className="dashboard-summary">
        <h2 className="section-title">Organization Overview</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <h3>Total Units</h3>
            <div className="stat-value">{units.length}</div>
          </div>
          <div className="stat-card">
            <h3>Regular Soldiers</h3>
            <div className="stat-value">{totalPersonnel.regularSoldiers}</div>
          </div>
          <div className="stat-card">
            <h3>Officers</h3>
            <div className="stat-value">{totalPersonnel.officers}</div>
          </div>
          <div className="stat-card">
            <h3>Senior Officers</h3>
            <div className="stat-value">{totalPersonnel.seniorOfficers}</div>
          </div>
          <div className="stat-card total">
            <h3>Total Personnel</h3>
            <div className="stat-value">{totalPersonnel.total}</div>
          </div>
        </div>
      </div>
      
      <div className="org-chart-section">
        <OrgChart />
      </div>
      
      <div className="top-units-section">
        <h2 className="section-title">Top-Level Units</h2>
        <div className="units-grid">
          {topLevelUnits.map(unit => (
            <UnitCard key={unit.unit_id} unit={unit} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;