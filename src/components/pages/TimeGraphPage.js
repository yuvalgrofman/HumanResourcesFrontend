import "./TimeGraphPage.css";
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Slider from '../chart/Slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {getUnitTimeSeries} from "../../api/api";

const TimeGraphPage = () => {
  const { selectedDate, pastDate, currentUnits, loading, error } = useData();
  
  // Component state for time graph parameters
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Available units for selection (derived from current units)
  const [availableUnits, setAvailableUnits] = useState([]);
  
  // Mock time series data - in a real app, this would come from an API
  const [timeSeriesData, setTimeSeriesData] = useState([]);

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
    }
  }, [currentUnits]);

 useEffect(() => {
  if (selectedUnits.length === 0) {
    setTimeSeriesData([]);
    return;
  }

  const fetchTimeSeriesData = async () => {
    try {
      const startYear = parseInt(pastDate.split('-')[0]);
      const endYear = parseInt(selectedDate.split('-')[0]);

      // Create an array of promises for each unit's time series data
      const promises = selectedUnits.map(unitId =>
        getUnitTimeSeries(unitId)
      );

      // Wait for all promises to resolve
      const unitsTimeSeriesData = await Promise.all(promises);

      // Organize the data by year
      const yearlyData = {};

      // Initialize year objects for each year in range
      for (let year = startYear; year <= endYear; year++) {
        yearlyData[year] = { year: year.toString() };
      }

      // Fill in the data for each unit
      unitsTimeSeriesData.forEach((response, index) => {
        const unitId = selectedUnits[index];
        const unit = availableUnits.find(u => u.id === unitId);

        if (!unit || !response) return;

        // Access the data array from the response
        const unitTimeData = response.data || [];

        unitTimeData.forEach(dataPoint => {
          const year = parseInt(dataPoint.date.split('-')[0]);
          if (year >= startYear && year <= endYear) {
            // Add this unit's data to the year
            yearlyData[year][unit.name] = dataPoint.total_personnel || 0;
          }
        });
      });

      // Convert object to array and sort by year
      const data = Object.values(yearlyData).sort((a, b) =>
        parseInt(a.year) - parseInt(b.year)
      );

      setTimeSeriesData(data);

    } catch (error) {
      console.error('Error fetching time series data:', error);
      // If API fails, fall back to current data for visualization
      const fallbackData = generateFallbackData();
      setTimeSeriesData(fallbackData);
    }
  };

  // Fallback function that uses current data (for error cases)
  const generateFallbackData = () => {
    const startYear = parseInt(pastDate.split('-')[0]);
    const endYear = parseInt(selectedDate.split('-')[0]);
    const data = [];

    for (let year = startYear; year <= endYear; year++) {
      const dataPoint = { year: year.toString() };

      selectedUnits.forEach(unitId => {
        const unit = availableUnits.find(u => u.id === unitId);
        if (unit) {
          dataPoint[unit.name] = unit.total_personnel || 0;
        }
      });

      data.push(dataPoint);
    }

    return data;
  };

  fetchTimeSeriesData();
}, [selectedUnits, availableUnits, pastDate, selectedDate]);

  // Control Panel Component
  const ControlPanel = () => {
    const handleUnitToggle = (unitId) => {
      setSelectedUnits(prev => 
        prev.includes(unitId) 
          ? prev.filter(id => id !== unitId)
          : [...prev, unitId]
      );
    };

    const handleSearchKeyPress = (e) => {
      if (e.key === 'Enter') {
        setSearchTerm(e.target.value.trim());
      }
    };

    const filterBySearchTerm = (units, searchTerm) => {
      if (!searchTerm) return units;
      return units.filter(unit =>
        unit.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    const selectAllUnits = () => {
      const filteredUnits = filterBySearchTerm(availableUnits, searchTerm);
      const allIds = filteredUnits.map(unit => unit.id);
      setSelectedUnits(allIds);
    };

    const clearAllUnits = () => {
      setSelectedUnits([]);
      };

    const totalSelectedPersonnel = selectedUnits.reduce((total, unitId) => {
      const unit = availableUnits.find(u => u.id === unitId);
      return total + (unit?.total_personnel || 0);
    }, 0);

    return (
      <div className="control-panel-time-graph">
        <div className="control-panel-header-time-graph">
          <h3 className="mb-0">
            <i className="fas fa-chart-line me-2"></i>
            Time Graph Controls
          </h3>
          <p className="text-muted small mb-0 mt-1">Select units to visualize over time</p>
        </div>
        
        <div className="control-section-time-graph">
          <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
            <label className="form-label-time-graph fw-bold mb-0">
              <i className="fas fa-users me-2 text-primary"></i>
              Select Units
            </label>
            <div className="btn-group-time-graph btn-group-sm">
              <button 
                className="btn btn-outline-primary-time-graph btn-sm"
                onClick={selectAllUnits}
                disabled={availableUnits.length === 0}
              >
                Select All
              </button>
              <button 
                className="btn btn-outline-secondary-time-graph btn-sm"
                onClick={clearAllUnits}
                disabled={selectedUnits.length === 0}
              >
                Clear
              </button>
            </div>
          </div>
          
          {availableUnits.length > 0 && (
            <div className="search-container-time-graph mb-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search units..."
                onKeyPress={handleSearchKeyPress}
              />
            </div>
          )}
          
          <div className="checkbox-group-time-graph">
            <div className="checkbox-scroll-time-graph">
              {filterBySearchTerm(availableUnits, searchTerm).map(unit => (
                <div key={unit.id} className="form-check checkbox-item-time-graph">
                  <input
                    type="checkbox"
                    id={`unit-${unit.id}`}
                    checked={selectedUnits.includes(unit.id)}
                    onChange={() => handleUnitToggle(unit.id)}
                    className="form-check-input-time-graph"
                  />
                  <label htmlFor={`unit-${unit.id}`} className="form-check-label-time-graph">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div>
                        <span className="unit-name-time-graph">{unit.name}</span>
                        {unit.parent_id && (
                          <div className="unit-hierarchy-time-graph">
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
        </div>

        <div className="control-section-time-graph">
          <div className="status-bar-time-graph">
            <h5 className="mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Selection Summary
            </h5>
            <div className="row g-2">
              <div className="col-6">
                <div className="stat-card-time-graph">
                  <div className="stat-number-time-graph text-primary">{selectedUnits.length}</div>
                  <div className="stat-label-time-graph">Selected Units</div>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card-time-graph">
                  <div className="stat-number-time-graph text-success">{totalSelectedPersonnel.toLocaleString()}</div>
                  <div className="stat-label-time-graph">Total Personnel</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generate colors for different units
  const getUnitColor = (index) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
      '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1',
      '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
    ];
    return colors[index % colors.length];
  };

  if (loading) return <div className="loading-spinner-time-graph">Loading...</div>;
  if (error) return <div className="error-message-time-graph text-danger">{error}</div>;

  return (
    <div className="time-graph-page">
      {/* Left Control Panel */}
      <div className="left-panel-time-graph">
        <ControlPanel />
      </div>
      
      {/* Main Content Area */}
      <div className="main-content-time-graph">
        
        {/* Chart Container */}
        <div className="chart-container-time-graph">
          {selectedUnits.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  formatter={(value, name) => [value.toLocaleString(), name]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Legend />
                {selectedUnits.map((unitId, index) => {
                  const unit = availableUnits.find(u => u.id === unitId);
                  return unit ? (
                    <Line
                      key={unitId}
                      type="monotone"
                      dataKey={unit.name}
                      stroke={getUnitColor(index)}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ) : null;
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message-time-graph">
              <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No Units Selected</h4>
              <p className="text-muted">Select units from the left panel to view their personnel trends over time.</p>
            </div>
          )}
        </div>
        
        {/* Date Control Slider */}
        <div className="slider-container-time-graph">
          <h3>Date Range Control</h3>
          <Slider minYear={2015} maxYear={2025} step={1} />
        </div>
      </div>
    </div>
  );
};

export default TimeGraphPage;