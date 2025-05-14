import "./OrgChartPage.css";
import React from 'react';
import { useData } from '../../context/DataContext';
import OrgChart from '../visualizations/OrgChart';
import ControlPanel from '../layout/ControlPanel';
import DataPanel from '../layout/DataPanel';

const OrgChartPage = () => {
  const { selectedDate } = useData();
  
  return (
    <div className="org-chart-page">
      {/* Control Panel */}
      <ControlPanel title="Organization Filters" />
      
      {/* Main Content Area */}
      <div className="main">
        <h1 className="text-2xl font-bold mb-4">Organizational Chart</h1>
        <p className="mb-6">
          Visualization of the army's organizational structure for {selectedDate}. 
          Click on any unit to view detailed information.
        </p>
        
        {/* Chart Container */}
        <div className="chart-container">
          <OrgChart />
        </div>
        
        {/* Legend/Help */}
        <div className="legend">
          <p>
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            Circle size represents the total personnel count
          </p>
          <p className="mt-1">
            Click on any unit to view its detailed information and historical data in the right panel.
          </p>
        </div>
      </div>
      
      {/* Data Panel */}
      <DataPanel />
    </div>
  );
};

export default OrgChartPage;
