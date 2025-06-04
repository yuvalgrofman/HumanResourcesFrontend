import React, { useState, useEffect } from 'react';
import PieChart from '../visualizations/PieChart';
import TimeGraph from '../visualizations/TimeGraph';
import { getUnitTimeSeries } from '../../api/api';
import "./DataPanel.css";

const DataPanel = ({ unit }) => {
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch time series data when unit changes
  useEffect(() => {
    const fetchTimeSeriesData = async () => {
      if (!unit || !unit.id) {
        setTimeSeriesData([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await getUnitTimeSeries(unit.id);
        setTimeSeriesData(response.data || []);
      } catch (err) {
        console.error('Error fetching time series data:', err);
        setError('Failed to load historical data');
        setTimeSeriesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSeriesData();
  }, [unit]);

  // Show empty state when no unit is selected
  if (!unit) {
    return (
      <div className="data-panel">
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-mouse-pointer"></i>
          </div>
          <h3>Select a Unit</h3>
          <p>Click on any unit in the organizational chart to view detailed information and analytics.</p>
        </div>
      </div>
    );
  }

  // Prepare data for pie chart
  const pieData = [
    { 
      name: "Regular Soldiers", 
      value: unit.regular_soldiers || 0, 
      color: "#3B82F6" 
    },
    { 
      name: "Officers", 
      value: unit.officers || 0, 
      color: "#10B981" 
    },
    { 
      name: "Senior Officers", 
      value: unit.senior_officers || 0, 
      color: "#F59E0B" 
    }
  ];

  // Prepare time series data for the graph
  const prepareTimeSeriesData = () => {
    return timeSeriesData.map(item => ({
      date: item.date,
      total_personnel: item.total_personnel,
      regular_soldiers: item.regular_soldiers,
      officers: item.officers,
      senior_officers: item.senior_officers
    }));
  };

  return (
    <div className="data-panel">
      {/* Header Section */}
      <div className="panel-header">
        <div className="unit-badge">
          <i className="fas fa-shield-alt"></i>
        </div>
        <div className="unit-info">
          <h2 className="unit-name">{unit.name}</h2>
          <p className="unit-id">ID: {unit.id}</p>
          {unit.parent_id && (
            <p className="unit-parent">
              <i className="fas fa-level-up-alt"></i>
              Parent: {unit.parent_id}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{unit.total_personnel || 0}</h3>
            <p>Total Personnel</p>
          </div>
        </div>
        <div className="stat-card officers">
          <div className="stat-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="stat-content">
            <h3>{unit.officers || 0}</h3>
            <p>Officers</p>
          </div>
        </div>
        <div className="stat-card senior">
          <div className="stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <h3>{unit.senior_officers || 0}</h3>
            <p>Senior</p>
          </div>
        </div>
        <div className="stat-card soldiers">
          <div className="stat-icon">
            <i className="fas fa-user"></i>
          </div>
          <div className="stat-content">
            <h3>{unit.regular_soldiers || 0}</h3>
            <p>Soldiers</p>
          </div>
        </div>
      </div>

      {/* Personnel Distribution Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>
            <i className="fas fa-chart-pie"></i>
            Personnel Distribution
          </h3>
          <p>Breakdown of personnel by rank category</p>
        </div>
        <div className="chart-container pie-chart">
          <PieChart data={pieData} />
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>
            <i className="fas fa-chart-line"></i>
            Historical Trends
          </h3>
          <p>Personnel changes over time</p>
        </div>
        <div className="chart-container time-chart">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading historical data...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          ) : timeSeriesData.length > 0 ? (
            <TimeGraph data={prepareTimeSeriesData()} />
          ) : (
            <div className="empty-chart-state">
              <i className="fas fa-chart-line"></i>
              <p>No historical data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Unit Details */}
      <div className="details-section">
        <div className="detail-header">
          <h3>
            <i className="fas fa-info-circle"></i>
            Unit Details
          </h3>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{unit.date || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Officer Ratio:</span>
            <span className="detail-value">
              {unit.total_personnel > 0 
                ? `${(((unit.officers || 0) + (unit.senior_officers || 0)) / unit.total_personnel * 100).toFixed(1)}%`
                : 'N/A'
              }
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Senior Officer Ratio:</span>
            <span className="detail-value">
              {unit.officers > 0 
                ? `${((unit.senior_officers || 0) / ((unit.officers || 0) + (unit.senior_officers || 0)) * 100).toFixed(1)}%`
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPanel;