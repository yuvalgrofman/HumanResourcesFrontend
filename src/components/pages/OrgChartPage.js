import "./OrgChartPage.css";
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import OrgChart from '../visualizations/OrgChart';
import DataPanel from '../layout/DataPanel';
import Slider from '../chart/Slider';

const OrgChartPage = () => {
  const { selectedDate, pastDate, currentUnits, pastUnits } = useData();
  
  // Component state for org chart parameters
  const [rootUnit, setRootUnit] = useState('');
  const [childUnits, setChildUnits] = useState([]);
  const [parallelUnits, setParallelUnits] = useState([]);
  const [parallelSearchTerm, setParallelSearchTerm] = useState('');
  
  // Available units for selection (derived from current units)
  const [availableUnits, setAvailableUnits] = useState([]);

  // Extract flat list of units from hierarchical structure
  useEffect(() => {
    const flattenUnits = (units) => {
      const result = [];
      const traverse = (unitList) => {
        if (!unitList || !Array.isArray(unitList)) {
          return;
        }
        
        unitList.forEach(unit => {
          result.push({
            id: unit.unit_id,
            name: unit.unit_name,
            parent_id: unit.parent_unit_id,
            regular_soldiers: unit.regular_soldiers,
            officers: unit.officers,
            senior_officers: unit.senior_officers,
            total_personnel: unit.total_personnel,
            date: unit.date
          });
          
          // Recursively traverse sub_units
          if (unit.sub_units && unit.sub_units.length > 0) {
            traverse(unit.sub_units);
          }
        });
      };
      
      // Handle both single unit object and array of units
      if (Array.isArray(units)) {
        traverse(units);
      } else if (units && typeof units === 'object') {
        traverse([units]);
      }
      
      return result;
    };

    if (currentUnits && currentUnits.length > 0) {
      const flattened = flattenUnits(currentUnits);
      setAvailableUnits(flattened);
      
      // Set default root unit if none selected
      if (!rootUnit && flattened.length > 0) {
        const topLevelUnit = flattened.find(unit => !unit.parent_id) || flattened[0];
        setRootUnit(topLevelUnit.id);
      }
    }
  }, [currentUnits, rootUnit]);

  // Get child units of the selected root unit
  useEffect(() => {
    if (rootUnit && availableUnits.length > 0) {
      const children = availableUnits.filter(unit => unit.parent_id === rootUnit);
      setChildUnits(children.map(child => child.id));
    }
  }, [rootUnit, availableUnits]);

  // Control Panel Component
  const ControlPanel = () => {
    const handleRootUnitChange = (e) => {
      setRootUnit(e.target.value);
    };

    const handleChildUnitToggle = (unitId) => {
      setChildUnits(prev => 
        prev.includes(unitId) 
          ? prev.filter(id => id !== unitId)
          : [...prev, unitId]
      );
    };

    const handleParallelUnitToggle = (unitId) => {
      setParallelUnits(prev => 
        prev.includes(unitId) 
          ? prev.filter(id => id !== unitId)
          : [...prev, unitId]
      );
    };

    const rootUnitObj = availableUnits.find(unit => unit.id === rootUnit);
    const childUnitOptions = availableUnits.filter(unit => unit.parent_id === rootUnit);
    // Show all units except the root unit for parallel selection
    const parallelUnitOptions = availableUnits.filter(unit => unit.id !== rootUnit);

    return (
      <div className="control-panel-org">
        <div className="control-panel-header">
          <h3 className="mb-0">
            <i className="fas fa-cogs me-2"></i>
            Organization Controls
          </h3>
          <p className="text-muted small mb-0 mt-1">Configure your organizational chart view</p>
        </div>
        
        <div className="control-section">
          <label className="form-label fw-bold">
            <i className="fas fa-sitemap me-2 text-primary"></i>
            Root Unit
          </label>
          <select 
            className="form-select form-select-sm"
            value={rootUnit} 
            onChange={handleRootUnitChange}
          >
            <option value="">Select Root Unit</option>
            {availableUnits.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.total_personnel} personnel)
              </option>
            ))}
          </select>
          <div className="form-text">
            Choose the primary unit to display at the center of your chart
          </div>
        </div>

        <div className="control-section">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label fw-bold mb-0">
              <i className="fas fa-users me-2 text-success"></i>
              Child Units
            </label>
            <span className="badge bg-success rounded-pill">{childUnits.length}</span>
          </div>
          <div className="checkbox-group">
            {childUnitOptions.length > 0 ? (
              childUnitOptions.map(unit => (
                <div key={unit.id} className="form-check checkbox-item">
                  <input
                    type="checkbox"
                    id={`child-${unit.id}`}
                    checked={childUnits.includes(unit.id)}
                    onChange={() => handleChildUnitToggle(unit.id)}
                    className="form-check-input"
                  />
                  <label htmlFor={`child-${unit.id}`} className="form-check-label">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <span>{unit.name}</span>
                      <small className="text-muted">{unit.total_personnel}</small>
                    </div>
                  </label>
                </div>
              ))
            ) : (
              <div className="text-center p-3">
                <i className="fas fa-info-circle text-muted me-2"></i>
                <span className="text-muted">No child units available</span>
              </div>
            )}
          </div>
          <div className="form-text">
            Select subordinate units to display below the root unit
          </div>
        </div>

        <div className="control-section">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label fw-bold mb-0">
              <i className="fas fa-layer-group me-2 text-warning"></i>
              Parallel Units
            </label>
            <span className="badge bg-warning rounded-pill text-dark">{parallelUnits.length}</span>
          </div>
          <div className="checkbox-group">
            {parallelUnitOptions.length > 0 ? (
              <div className="search-container mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search units..."
                  onChange={(e) => setParallelSearchTerm(e.target.value)}
                />
              </div>
            ) : null}
            <div className="checkbox-scroll">
              {parallelUnitOptions
                .filter(unit => 
                  !parallelSearchTerm || 
                  unit.name.toLowerCase().includes(parallelSearchTerm.toLowerCase())
                )
                .map(unit => (
                <div key={unit.id} className="form-check checkbox-item">
                  <input
                    type="checkbox"
                    id={`parallel-${unit.id}`}
                    checked={parallelUnits.includes(unit.id)}
                    onChange={() => handleParallelUnitToggle(unit.id)}
                    className="form-check-input"
                  />
                  <label htmlFor={`parallel-${unit.id}`} className="form-check-label">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div>
                        <span className="unit-name-org">{unit.name}</span>
                        {unit.parent_id && (
                          <div className="unit-hierarchy">
                            <small className="text-muted">
                              <i className="fas fa-arrow-up me-1"></i>
                              {availableUnits.find(p => p.id === unit.parent_id)?.name || 'Unknown Parent'}
                            </small>
                          </div>
                        )}
                      </div>
                      <small className="text-muted fw-bold">{unit.total_personnel}</small>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="form-text">
            Select additional units to display alongside the root unit
          </div>
        </div>

        <div className="control-section">
          <div className="selected-summary">
            <h5 className="mb-3">
              <i className="fas fa-chart-line me-2"></i>
              Current Selection
            </h5>
            <div className="row g-2">
              <div className="col-12">
                <div className="summary-item">
                  <span className="summary-label">Root Unit:</span>
                  <span className="summary-value">{rootUnitObj?.name || 'None selected'}</span>
                </div>
              </div>
              <div className="col-6">
                <div className="summary-stat">
                  <div className="stat-number">{childUnits.length}</div>
                  <div className="stat-label">Children</div>
                </div>
              </div>
              <div className="col-6">
                <div className="summary-stat">
                  <div className="stat-number">{parallelUnits.length}</div>
                  <div className="stat-label">Parallel</div>
                </div>
              </div>
            </div>
            {rootUnitObj && (
              <div className="mt-2 pt-2 border-top">
                <small className="text-muted">
                  <i className="fas fa-users me-1"></i>
                  Total Personnel: <strong>{rootUnitObj.total_personnel}</strong>
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="org-chart-page">
      {/* Left Control Panel */}
      <div className="left-panel">
        <ControlPanel />
      </div>
      
      {/* Main Content Area */}
      <div className="main-content">
        <div className="chart-header">
          <h1 className="chart-title">Organizational Chart</h1>
          <p className="chart-description">
            Visualization of the army's organizational structure for {selectedDate}. 
            Click on any unit to view detailed information.
          </p>
        </div>
        
        {/* Chart Container */}
        <div className="chart-container-org">
          <OrgChart 
            selectedDate={selectedDate}
            pastDate={pastDate}
            rootUnit={rootUnit}
            childUnits={childUnits}
            parallelUnits={parallelUnits}
          />
        </div>
        
        {/* Date Control Slider */}
        <div className="slider-container">
          <h3>Date Range Control</h3>
          <Slider minYear={2015} maxYear={2025} step={1} />
        </div>
        
        {/* Legend/Help */}
        <div className="legend">
          <h4>Legend</h4>
          <div className="legend-item">
            <span className="legend-dot bg-blue-500"></span>
            Circle size represents the total personnel count
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-green-500"></span>
            Click on any unit to view its detailed information in the right panel
          </div>
        </div>
      </div>
      
      {/* Right Data Panel */}
      <div className="right-panel">
        <DataPanel />
      </div>
    </div>
  );
};

export default OrgChartPage;