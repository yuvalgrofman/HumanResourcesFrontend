import "./ChordDiagramPage.css"; // Import your CSS styles
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import DataPanel from '../layout/DataPanel';
import Slider from '../chart/Slider';
import ChordDiagram from '../visualizations/ChordDiagram';

const ChordDiagramPage = () => {
  const { selectedDate, pastDate, currentUnits, pastUnits } = useData();
  
  // Component state for org chart parameters
  const [rootUnit, setRootUnit] = useState('');
  const [childUnits, setChildUnits] = useState([]);
  const [parallelUnits, setParallelUnits] = useState([]);
  
  // New state for clicked node functionality
  const [clickedNodeID, setClickedNodeID] = useState('');
  
  // State for org chart levels
  const [levels, setLevels] = useState(3);
  
  // State for arrow filter value
  const [arrowFilterValue, setArrowFilterValue] = useState(0);
  
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

  // Handle clicked node changes
  useEffect(() => {
    if (clickedNodeID) {
      // console.log('Clicked node ID:', clickedNodeID);
      // const clickedUnit = availableUnits.find(unit => unit.id === clickedNodeID);
      // if (clickedUnit) {
      //   console.log('Clicked unit details:', clickedUnit);
      // }
    }
  }, [clickedNodeID, availableUnits]);

  // Find the clicked unit object from availableUnits
  const clickedUnit = availableUnits.find(unit => unit.id === clickedNodeID);

  return (
    <div className="chord-chart-page">
      {/* Main Content Area */}
      <div className="main-content">
        <div className="chart-header">
          <h1 className="chart-title">Chord Diagram Visualization</h1>
          <p className="chart-description">
            Interactive chord diagram showing relationships between organizational units for {selectedDate}. 
            Click on any node to view detailed information.
          </p>
        </div>
        
        {/* Chart Container */}
        <div className="chart-container-chord">
          <ChordDiagram 
            selectedDate={selectedDate}
            pastDate={pastDate}
            rootUnit={rootUnit}
            childUnits={childUnits}
            parallelUnits={parallelUnits}
            clickedNodeID={clickedNodeID}
            setClickedNodeID={setClickedNodeID}
            levels={levels}
            arrowFilterValue={arrowFilterValue}
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
            Arc thickness represents the strength of relationships
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-green-500"></span>
            Click on any segment to view detailed information in the right panel
          </div>
        </div>
      </div>
      
      {/* Right Data Panel */}
      <div className="right-panel">
        <DataPanel unit={clickedUnit} />
      </div>
    </div>
  );
};

export default ChordDiagramPage;