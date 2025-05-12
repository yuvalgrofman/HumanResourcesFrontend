import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import OrgChart from '../components/OrgChart';
import UnitCard from '../components/UnitCard';
import { getUnitSubtree } from '../services/api';
import './UnitDetails.css';

const UnitDetails = () => {
  const { unitId } = useParams();
  const { 
    findUnitById, 
    selectUnitById, 
    selectedUnit, 
    selectedDate,
    loading, 
    error, 
    setSelectedUnit 
  } = useData();

  // Load unit data when component mounts or unitId/date changes
  useEffect(() => {
    const loadUnitData = async () => {
      try {
        // First try to find the unit in the current data context
        const unitFromContext = findUnitById(unitId);
        
        if (unitFromContext) {
          selectUnitById(unitId);
        } else {
          // If not found in context, fetch from API
          const unitData = await getUnitSubtree(unitId, selectedDate);
          setSelectedUnit(unitData);
        }
      } catch (err) {
        console.error(`Error loading unit ${unitId}:`, err);
      }
    };

    loadUnitData();
  }, [unitId, selectedDate, findUnitById, selectUnitById, setSelectedUnit]);

  if (loading) {
    return <div className="loading-spinner">Loading unit data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!selectedUnit) {
    return <div className="error-message">Unit not found</div>;
  }

  return (
    <div className="unit-details">
      <div className="breadcrumbs">
        <Link to="/">Dashboard</Link> / <span>{selectedUnit.unit_name}</span>
      </div>
      
      <div className="unit-details-header">
        <h1 className="unit-title">{selectedUnit.unit_name}</h1>
        <div className="unit-meta">
          <span className="unit-id">ID: {selectedUnit.unit_id}</span>
          {selectedUnit.parent_unit_id && (
            <span className="parent-unit">
              Parent: <Link to={`/unit/${selectedUnit.parent_unit_id}`}>{selectedUnit.parent_unit_id}</Link>
            </span>
          )}
        </div>
      </div>
      
      <div className="unit-stats-overview">
        <div className="stat-box">
          <h3>Regular Soldiers</h3>
          <div className="stat-value">{selectedUnit.regular_soldiers}</div>
        </div>
        <div className="stat-box">
          <h3>Officers</h3>
          <div className="stat-value">{selectedUnit.officers}</div>
        </div>
        <div className="stat-box">
          <h3>Senior Officers</h3>
          <div className="stat-value">{selectedUnit.senior_officers}</div>
        </div>
        <div className="stat-box total">
          <h3>Total Personnel</h3>
          <div className="stat-value">{selectedUnit.total_personnel}</div>
        </div>
      </div>
      
      <div className="org-chart-section">
        <OrgChart unit={selectedUnit} />
      </div>
      
      {selectedUnit.sub_units && selectedUnit.sub_units.length > 0 && (
        <div className="sub-units-section">
          <h2 className="section-title">Sub Units</h2>
          <div className="units-grid">
            {selectedUnit.sub_units.map(subUnit => (
              <UnitCard key={subUnit.unit_id} unit={subUnit} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitDetails;