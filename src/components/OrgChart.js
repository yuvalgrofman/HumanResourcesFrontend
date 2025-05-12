import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { getUnitSubtree } from '../services/api';
import './OrgChart.css';
import { ChevronDown, ChevronRight, Users, Star, Award, Filter, X } from 'lucide-react';

const OrgChart = ({ unit }) => {
  const { selectedDate } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unitData, setUnitData] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [filterValue, setFilterValue] = useState("");
  const [filterType, setFilterType] = useState("name"); // "name", "regular", "officers", "senior", "total"
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the passed date prop or fall back to the selectedDate from context
  const effectiveDate = selectedDate;
  
  // Create a memoized fetchUnitData function
  const fetchUnitData = useCallback(async () => {
    if (!unit?.unit_id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getUnitSubtree(unit.unit_id, effectiveDate);
      
      // Convert sub_units to children for consistency if needed
      const normalizedData = normalizeUnitData(data);
      setUnitData(normalizedData);
      
      // Initialize the root unit as expanded
      if (normalizedData) {
        setExpandedUnits(prev => ({...prev, [normalizedData.unit_id || normalizedData.id]: true}));
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch unit data:', err);
      setError('Failed to load organizational chart data');
    } finally {
      setLoading(false);
    }
  }, [unit?.unit_id, effectiveDate]);

  // Normalize data structure for consistency (sub_units -> children)
  const normalizeUnitData = (unit) => {
    if (!unit) return null;
    
    // Create a copy of the unit to avoid mutating the original
    const normalizedUnit = {...unit};
    
    // Convert sub_units to children for consistency
    if (normalizedUnit.sub_units && !normalizedUnit.children) {
      normalizedUnit.children = normalizedUnit.sub_units.map(child => normalizeUnitData(child));
    } else if (normalizedUnit.children) {
      normalizedUnit.children = normalizedUnit.children.map(child => normalizeUnitData(child));
    }
    
    return normalizedUnit;
  };
  
useEffect(() => {
  if (unit?.unit_id) {
    fetchUnitData();
  }
}, [unit?.unit_id, effectiveDate, fetchUnitData]);

  
  // Toggle expanded/collapsed state of a unit
  const toggleExpand = (unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };
  
  // Check if a unit matches the current filter
  const matchesFilter = (unit) => {
    if (!filterValue) return true;
    
    const lowerFilterValue = filterValue.toLowerCase();
    
    switch (filterType) {
      case "name":
        return (unit.unit_name || unit.name || "").toLowerCase().includes(lowerFilterValue);
      case "regular":
        return unit.regular_soldiers >= parseInt(filterValue, 10);
      case "officers":
        return unit.officers >= parseInt(filterValue, 10);
      case "senior":
        return unit.senior_officers >= parseInt(filterValue, 10);
      case "total":
        return unit.total_personnel >= parseInt(filterValue, 10);
      default:
        return true;
    }
  };
  
  // Check if a unit or any of its descendants match the filter
  const unitOrDescendantsMatchFilter = (unit) => {
    if (!unit) return false;
    if (matchesFilter(unit)) return true;
    
    if (unit.children && unit.children.length > 0) {
      return unit.children.some(child => unitOrDescendantsMatchFilter(child));
    }
    
    return false;
  };
  
  // Calculate the unit level in the hierarchy (for styling purposes)
  const getUnitLevel = (unitId, data, level = 0) => {
    if (!data) return 0;
    if (data.unit_id === unitId || data.id === unitId) return level;
    
    const children = data.children || [];
    for (const child of children) {
      const childLevel = getUnitLevel(unitId, child, level + 1);
      if (childLevel > level) return childLevel;
    }
    
    return level;
  };
  
  // Get background color based on unit level
  const getLevelColor = (unitId) => {
    const level = getUnitLevel(unitId, unitData);
    const colors = [
      { bg: '#e6f7ff', border: '#1890ff' }, // Level 0 - Blue
      { bg: '#f6ffed', border: '#52c41a' }, // Level 1 - Green
      { bg: '#fff7e6', border: '#fa8c16' }, // Level 2 - Orange
      { bg: '#f9f0ff', border: '#722ed1' }, // Level 3 - Purple
      { bg: '#fcf5e5', border: '#d46b08' }  // Level 4+ - Brown
    ];
    
    return colors[Math.min(level, colors.length - 1)];
  };
  
  // Get icon based on unit level
  const getLevelIcon = (unitId) => {
    const level = getUnitLevel(unitId, unitData);
    switch (level) {
      case 0:
        return <Award className="unit-icon" size={18} />;
      case 1:
        return <Star className="unit-icon" size={18} />;
      default:
        return <Users className="unit-icon" size={18} />;
    }
  };
  
  // Reset all filters
  const resetFilter = () => {
    setFilterValue("");
    setFilterType("name");
    setShowFilters(false);
  };

  // Recursive function to render a unit and its children
  const renderByLevels = (root) => {
    if (!root) return null;

    const queue = [[root, 0]];
    const levels = [];

    while (queue.length > 0) {
      const [current, level] = queue.shift();

      if (!levels[level]) levels[level] = [];
      levels[level].push(current);

      if (expandedUnits[current.unit_id] && current.children) {
        for (const child of current.children) {
          queue.push([child, level + 1]);
        }
      }
    }

    return (
      <div className="levels-container">
        {levels.map((unitsAtLevel, levelIndex) => (
          <div key={levelIndex}>
            {/* Unit Cards with top connectors */}
            <div className="unit-level-row">
              {unitsAtLevel.map(unit => (
                <div key={unit.unit_id} className="connector-wrapper">
                  {levelIndex > 0 && <div className="connector-line" />}
                  {renderUnitCard(unit)}
                </div>
              ))}
            </div>

            {/* Horizontal connectors to children */}
            {levelIndex < levels.length - 1 && (
              <div className="children-connectors">
                {levels[levelIndex + 1].map((child, index) => (
                  <div key={child.unit_id} className="child-connector" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  // Render the unit tree recursively
  const renderUnitCard = (unit) => {
    const unitId = unit.unit_id || unit.id;
    const isExpanded = !!expandedUnits[unitId];
    const children = unit.children || [];
    const hasChildren = children.length > 0;
    const levelColors = getLevelColor(unitId);
    const matchesCurrentFilter = matchesFilter(unit);
    const descendantsMatch = hasChildren && children.some(unitOrDescendantsMatchFilter);
    const shouldRenderHighlighted = !filterValue || matchesCurrentFilter || descendantsMatch;

    return (
      <div 
        className={`unit-card ${shouldRenderHighlighted ? 'highlighted' : 'faded'}`}
        style={{ backgroundColor: levelColors.bg, borderColor: levelColors.border }}
      >
        <div className="unit-header">
          {hasChildren && (
            <button 
              className="toggle-button" 
              onClick={() => toggleExpand(unitId)}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <div className="unit-title">
            {getLevelIcon(unitId)}
            <span className="unit-name">{unit.unit_name || unit.name}</span>
          </div>
        </div>
        {/* ...personnel stats... */}
      </div>
    );
  };

  return (
    <div className="org-chart-container">
      <div className="org-chart-header">
        <h3 className="org-chart-title">Organizational Chart</h3>
        <div className="org-chart-controls">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {filterValue && (
            <button className="reset-filter" onClick={resetFilter}>
              <X size={16} />
              Clear Filter
            </button>
          )}
        </div>
        
        <div className="org-chart-info">
          {unit ? (
            <span>Showing structure for: <strong>{unit.unit_name}</strong> as of <strong>{effectiveDate}</strong></span>
          ) : (
            <span>Showing full organization structure as of <strong>{effectiveDate}</strong></span>
          )}
        </div>
        
        {showFilters && (
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="filter-type">Filter by:</label>
              <select 
                id="filter-type" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="name">Unit Name</option>
                <option value="regular">Regular Soldiers ≥</option>
                <option value="officers">Officers ≥</option>
                <option value="senior">Senior Officers ≥</option>
                <option value="total">Total Personnel ≥</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="filter-value">Value:</label>
              <input 
                id="filter-value" 
                type={filterType === "name" ? "text" : "number"} 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder={filterType === "name" ? "Enter unit name..." : "Enter minimum value..."}
              />
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="loading-indicator">Loading organizational data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !unit ? (
        <div className="placeholder-chart">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"></path>
          </svg>
          <p>Please select a unit to view its organizational structure</p>
        </div>
      ) : !unitData ? (
        <div className="loading-indicator">Processing unit data...</div>
      ) : (
        <div className="org-chart">
                      <div className="unit-stats-summary">
            <div className="stat-row">
              <div className="stat-box">
                <h4>Regular Soldiers</h4>
                <p className="stat-value">{unitData.regular_soldiers}</p>
              </div>
              <div className="stat-box">
                <h4>Officers</h4>
                <p className="stat-value">{unitData.officers}</p>
              </div>
              <div className="stat-box">
                <h4>Senior Officers</h4>
                <p className="stat-value">{unitData.senior_officers}</p>
              </div>
              <div className="stat-box">
                <h4>Total Personnel</h4>
                <p className="stat-value">{unitData.total_personnel}</p>
              </div>
            </div>
          </div>
          
          <div className="unit-tree-container">
            <h4>Unit Hierarchy</h4>
            <div className="org-chart-tree">
              {renderByLevels(unitData)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgChart;