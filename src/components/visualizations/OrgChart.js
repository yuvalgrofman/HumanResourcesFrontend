import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useData } from '../../context/DataContext';
import ParallelUnitCard from '../chart/node/ParallelUnitCard';
import './OrgChart.css';

const OrgChart = ({ selectedDate, pastDate, rootUnit, childUnits, parallelUnits }) => {
  const { currentUnits, pastUnits } = useData();
  const [flatCurrentUnits, setFlatCurrentUnits] = useState([]);
  const [flatPastUnits, setFlatPastUnits] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Flatten the hierarchical units structure
  const flattenUnits = (units) => {
    const result = [];
    const traverse = (unitList) => {
      if (!unitList || !Array.isArray(unitList)) return;
      unitList.forEach(unit => {
        result.push({
          id: unit.unit_id,
          name: unit.unit_name,
          parent_id: unit.parent_unit_id,
          regular_soldiers: unit.regular_soldiers || 0,
          officers: unit.officers || 0,
          senior_officers: unit.senior_officers || 0,
          total_personnel: unit.total_personnel || 0,
          date: unit.date,
        });
        if (unit.sub_units && unit.sub_units.length > 0) {
          traverse(unit.sub_units);
        }
      });
    };
    if (Array.isArray(units)) {
      traverse(units);
    } else if (units && typeof units === 'object') {
      traverse([units]);
    }
    return result;
  };

  // Update flattened units when data changes
  useEffect(() => {
    if (currentUnits && currentUnits.length > 0) {
      setFlatCurrentUnits(flattenUnits(currentUnits));
    }
  }, [currentUnits]);

  useEffect(() => {
    if (pastUnits && pastUnits.length > 0) {
      setFlatPastUnits(flattenUnits(pastUnits));
    }
  }, [pastUnits]);

  // Full screen toggle
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
    // Reset zoom and pan when toggling full screen
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle escape key to exit full screen
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isFullScreen]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  const handleZoomReset = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };

  // Pan controls
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };
  const handleMouseUp = () => setIsPanning(false);

  // Keyboard zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); }
        else if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
        else if (e.key === '0') { e.preventDefault(); handleZoomReset(); }
      }
      // F11 or F key for full screen toggle
      if (e.key === 'F11' || (e.key === 'f' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        toggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.deltaY < 0 ? handleZoomIn() : handleZoomOut();
    }
  };

  const findUnitById = (units, unitId) => units.find(unit => unit.id === unitId);

  // Convert unit to card format
  const convertToCardFormat = (unit) => {

    // TODO: undo change
    if (!unit) return null;
    const randomValue = Math.floor(Math.random() * 100);
    const randomValue2 = Math.floor(Math.random() * 100);
    const randomValue3 = Math.floor(Math.random() * 100);
    const randomValue4 = Math.floor(Math.random() * 100);
    return { R1: randomValue, R2: randomValue2, R3: randomValue3, Total: randomValue4 };
  };

  const getGrowthType = (current, past) => {
    if (!current || !past) return 'Stable';
    const currentTotal = current.Total || 0;
    const pastTotal = past.Total || 0;
    if (currentTotal > pastTotal) return 'Increase';
    if (currentTotal < pastTotal) return 'Decrease';
    return 'Stable';
  };

  // Build tree structure and compute levels
  const buildTreeStructure = useMemo(() => {
    if (!flatCurrentUnits.length) return { levels: [], maxWidth: 0 };
    const unitMap = new Map();
    flatCurrentUnits.forEach(unit => {
      unitMap.set(unit.id, { ...unit, children: [], level: 0 });
    });
    
    // Build the tree structure, but only use specified childUnits for the root
    flatCurrentUnits.forEach(unit => {
      if (unit.parent_id && unitMap.has(unit.parent_id)) {
        // If this is the root unit, only add children that are in childUnits
        if (unit.parent_id === rootUnit) {
          if (childUnits.includes(unit.id)) {
            unitMap.get(unit.parent_id).children.push(unit.id);
          }
        } else {
          // For non-root units, add all children as normal
          unitMap.get(unit.parent_id).children.push(unit.id);
        }
      }
    });
    
    const rootData = unitMap.get(rootUnit);
    if (!rootData) return { levels: [], maxWidth: 0 };
    const level0Units = [rootUnit, ...parallelUnits.filter(id => unitMap.has(id))];
    const levels = [];
    const visited = new Set();
    levels.push(level0Units.map(unitId => ({ unitId, unit: unitMap.get(unitId), isRoot: unitId === rootUnit, isParallel: parallelUnits.includes(unitId) })));
    level0Units.forEach(id => visited.add(id));
    let currentLevelUnits = [rootUnit];
    while (currentLevelUnits.length > 0) {
      const nextLevelUnits = [];
      currentLevelUnits.forEach(unitId => {
        const unit = unitMap.get(unitId);
        if (unit && unit.children.length > 0) {
          unit.children.forEach(childId => {
            if (!visited.has(childId) && unitMap.has(childId)) {
              nextLevelUnits.push(childId);
              visited.add(childId);
            }
          });
        }
      });
      if (nextLevelUnits.length > 0) {
        levels.push(nextLevelUnits.map(unitId => ({ unitId, unit: unitMap.get(unitId), parentId: unitMap.get(unitId).parent_id })));
        currentLevelUnits = nextLevelUnits;
      } else break;
    }
    const maxWidth = Math.max(...levels.map(level => level.length));
    return { levels, maxWidth };
  }, [flatCurrentUnits, rootUnit, parallelUnits, childUnits]);

  // Render single unit card
  const renderUnitCard = (unitData) => {
    const { unitId, unit, isRoot, isParallel } = unitData;
    const currentUnit = unit;
    // const currentUnitName = Math.floor(1000 + Math.random() * 9000);
    const currentUnitName = currentUnit.name || `Unit ${unitId}`;
    const pastUnit = findUnitById(flatPastUnits, unitId);
    const currentAmount = convertToCardFormat(currentUnit);
    const lastAmount = convertToCardFormat(pastUnit) || currentAmount;
    const growthType = getGrowthType(currentAmount, lastAmount);
    return (
      <div key={unitId} className={`tree-node ${isRoot ? 'root-node' : ''} ${isParallel ? 'parallel-node' : ''}`}>
        <ParallelUnitCard unitName={currentUnitName} currentAmount={currentAmount} lastAmount={lastAmount} growthType={growthType} />
      </div>
    );
  };

  if (!buildTreeStructure.levels.length) {
    return (
      <div className={`org-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
        <div className="org-chart-message">
          <p>Please select a root unit to display the organizational chart.</p>
        </div>
      </div>
    );
  }

  const { levels, maxWidth } = buildTreeStructure;
  const gridWidth = Math.max(maxWidth * 320, 1200);
  const gridHeight = levels.length * 200 + 100;
  
  return (
    <div className={`org-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
      <div className="org-chart-header">
        <div className="header-info">
          <h3>Organizational Structure</h3>
          <p>{levels.length} levels • {flatCurrentUnits.length} total units</p>
        </div>
        <div className="header-controls">
          <div className="zoom-controls">
            <button className="zoom-btn zoom-out" onClick={handleZoomOut} title="Zoom Out (Ctrl + -)" disabled={zoomLevel <= 0.3}>−</button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button className="zoom-btn zoom-in" onClick={handleZoomIn} title="Zoom In (Ctrl + +)" disabled={zoomLevel >= 3}>+</button>
            <button className="zoom-btn zoom-reset" onClick={handleZoomReset} title="Reset Zoom (Ctrl + 0)">Reset</button>
          </div>
          <button 
            className={`fullscreen-btn ${isFullScreen ? 'active' : ''}`}
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit Full Screen (Esc or F)" : "Enter Full Screen (F or F11)"}
          >
            {isFullScreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="org-chart-scroll-container" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
        <div className="org-chart-viewport">
          <div className="org-chart-grid" style={{ width: `${gridWidth}px`, height: `${gridHeight}px`, gridTemplateColumns: `repeat(${maxWidth}, 1fr)`, gridTemplateRows: `repeat(${levels.length}, 200px)`, transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`, transformOrigin: 'center center' }}>
            {levels.map((level, levelIndex) => {
              const levelCount = level.length;
              const offset = Math.floor((maxWidth - levelCount) / 2);
              return level.map((unitData, unitIndex) => (
                <div key={`${levelIndex}-${unitData.unitId}`} className="grid-cell" style={{ gridColumn: offset + unitIndex + 1, gridRow: levelIndex + 1 }}>
                  {renderUnitCard(unitData)}
                </div>
              ));
            })}
          </div>
        </div>
      </div>
      <div className="org-chart-instructions">
        <p>Use mouse wheel + Ctrl to zoom • Click and drag to pan • Ctrl+0 to reset • {isFullScreen ? 'Press Esc or F to exit full screen' : 'Press F or F11 for full screen'}</p>
      </div>
    </div>
  );
};

OrgChart.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  pastDate: PropTypes.string.isRequired,
  rootUnit: PropTypes.string.isRequired,
  childUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  parallelUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default OrgChart;