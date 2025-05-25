import React from 'react';
import PieChart from '../visualizations/PieChart';
import TimeGraph from '../visualizations/TimeGraph';
import { useData } from '../../context/DataContext';
import "./DataPanel.css";

const DataPanel = () => {
  const { selectedUnit, unitTimeSeries, loading } = useData();

  if (loading) {
    return (
      <div className="data-panel">
        <h2>Unit Details</h2>
        <div className="chart-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!selectedUnit) {
    return (
      <div className="data-panel">
        <h2>Unit Details</h2>
        <p>Select a unit to view details</p>
      </div>
    );
  }

  // Prepare data for pie chart
  const pieData = [
    { name: "Regular Soldiers", value: selectedUnit.regular_soldiers, color: "#4285F4" },
    { name: "Officers", value: selectedUnit.officers, color: "#34A853" },
    { name: "Senior Officers", value: selectedUnit.senior_officers, color: "#FBBC05" }
  ];

  // Prepare time series data
  const timeData = unitTimeSeries?.data || [];

  return (
    <div className="data-panel">
      <h2>Unit Details</h2>
      <h3>{selectedUnit.unit_name}</h3>

      <div className="info-box">
        <p><strong>ID:</strong> {selectedUnit.unit_id}</p>
        {selectedUnit.parent_unit_id && <p><strong>Parent:</strong> {selectedUnit.parent_unit_id}</p>}
        <p><strong>Total:</strong> {selectedUnit.total_personnel} personnel</p>
      </div>

      <div className="p-8">
        <h3>Personnel Distribution</h3>
        <div className="chart-container low-padding">
          <PieChart data={pieData} />
        </div>
      </div>

      <div>
        <h3>Historical Data</h3>
        <div className="chart-container">
          {timeData.length > 0 ? (
            <TimeGraph data={timeData} />
          ) : (
            <p>No historical data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
