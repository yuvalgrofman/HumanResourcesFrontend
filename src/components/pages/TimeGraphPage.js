import "./TimeGraphPage.css";
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import MultiLineTimeGraph from '../visualizations/TimeGraph';
import DataPanel from '../layout/DataPanel';
import * as d3 from 'd3';

const TimeGraphPage = () => {
  const { units, unitTimeSeries, selectUnit } = useData();
  const [timeData, setTimeData] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);

  // Flatten nested units into a flat list for grid display
  const allUnits = useMemo(() => {
    const result = [];
    function traverse(list) {
      (list || []).forEach(u => {
        result.push(u);
        if (u.sub_units) traverse(u.sub_units);
      });
    }
    traverse(units);
    return result;
  }, [units]);

  useEffect(() => {
    if (!unitTimeSeries) return;

    setTimeData(prev => {
      const idx = prev.findIndex(u => u.unitId === unitTimeSeries.unit_id);
      const entry = {
        unitId: unitTimeSeries.unit_id,
        unitName: unitTimeSeries.data[0]?.unit_name || 'Unknown Unit',
        data: unitTimeSeries.data
      };
      if (idx >= 0) {
        const copy = [...prev]; copy[idx] = entry; return copy;
      }
      return [...prev, entry];
    });

    if (unitTimeSeries.unit_id && !selectedUnits.includes(unitTimeSeries.unit_id)) {
      setSelectedUnits(prev => [...prev, unitTimeSeries.unit_id]);
    }
  }, [unitTimeSeries, selectedUnits]);

  const removeUnit = id => {
    setTimeData(d => d.filter(u => u.unitId !== id));
    setSelectedUnits(s => s.filter(x => x !== id));
  };

  const prepareChartData = () => {
    if (timeData.length === 0) return [];
    const combined = [];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    timeData.forEach((unit, idx) => {
      const unitColor = colorScale(idx);
      unit.data.forEach(record => {
        combined.push({
          date: record.date,
          unitId: unit.unitId,
          unitName: unit.unitName,
          value: record.total_personnel,
          color: unitColor
        });
      });
    });
    return combined;
  };

  return (
    <div className="time-graph-page">
      <aside className="controls">
        <h2>Time Graph Controls</h2>

        <div className="section">
          <h3>Available Units</h3>
          {allUnits.length > 0 ? (
            <div className="unit-grid">
              {allUnits.map(unit => (
                <div
                  key={unit.unit_id}
                  className={`unit-card ${selectedUnits.includes(unit.unit_id) ? 'active' : ''}`}
                  onClick={() => selectUnit(unit.unit_id)}
                >
                  <h4>{unit.unit_name}</h4>
                </div>
              ))}
            </div>
          ) : (
            <p className="description">No units available</p>
          )}
        </div>

        <div className="section">
          <h3>Selected Units</h3>
          {timeData.length === 0 ? (
            <p className="description">No units selected</p>
          ) : (
            <ul className="list">
              {timeData.map(u => (
                <li key={u.unitId}>
                  <span>{u.unitName}</span>
                  <button className="remove" onClick={() => removeUnit(u.unitId)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="section">
          <h3>Chart Options</h3>
          <div>
            <label>Chart Type</label>
            <select>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
          <div>
            <label>Data Type</label>
            <select>
              <option value="total">Total Personnel</option>
              <option value="regular">Regular Soldiers</option>
              <option value="officers">Officers</option>
              <option value="senior">Senior Officers</option>
            </select>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <h1>Time-Based Graph</h1>
        <p className="description">
          Historical personnel data visualization. Select units from the left panel to compare trends.
        </p>

        <div className="chart-container">
          {timeData.length === 0 ? (
            <div className="chart-empty">
              <p>No units selected</p>
              <p>Select one or more units from the left panel to view their data</p>
            </div>
          ) : (
            <MultiLineTimeGraph data={prepareChartData()} height="500px" width="500px" />
          )}
        </div>
      </main>

      <DataPanel />
    </div>
  );
};

export default TimeGraphPage;
