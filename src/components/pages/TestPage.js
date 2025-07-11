import "./TestPage.css"; // Assuming you have some CSS for styling
import React from 'react';
import { useData } from '../../context/DataContext';
import OrgChart from '../visualizations/OrgChart';
import TimeGraph from '../visualizations/TimeGraph';
import ControlPanel from '../layout/ControlPanel';
import DataPanel from '../layout/DataPanel';
import Slider from '../chart/Slider';
import CompleteUnitCard from '../chart/node/CompleteUnitCard';
import ParallelUnitCard from "../chart/node/ParallelUnitCard";
import PieChart from '../visualizations/PieChart';

const TestPage = () => {
  const { currentUnits, selectedDate } = useData();
  const sampleData = [
    { name: 'Engineering', value: 45, color: '#667eea' },
    { name: 'Design', value: 25, color: '#764ba2' },
    { name: 'Marketing', value: 20, color: '#f093fb' },
    { name: 'Sales', value: 15, color: '#f5576c' },
    { name: 'Support', value: 10, color: '#4facfe' }
  ];
  
  return (
    <div className="dashboard">
      
      <PieChart data={sampleData} width={400} height={400} />
      {/* Main Content Area */}
      <div className="main">
        <h1 className="text-2xl font-bold mb-6">Army HR Dashboard - {selectedDate}</h1>
          <CompleteUnitCard
            unitName="12345"
            currentAmount={{ 'R1': 20, 'R2': 15, "E+": 5, Total: 55 }}
            lastAmount={{ 'R1': 18, 'R2': 17, "E+": 45, Total: 50 }}
            growthType="Increase"
            minValue={0}
            maxValue={50}
            backgroundGrowthColor="#4caf50"
            backgroundDeclineColor="#f44336"
          />
          <ParallelUnitCard
            unitName="67890"
            currentAmount={{ R1: 10, R2: 20, "E+": 30, Total: 55 }}
            lastAmount={{ R1: 12, R2: 18, "E+": 25, Total: 10 }}
            growthType="Decrease"
            minValue={0}
            maxValue={50}
            backgroundGrowthColor="#4caf50"
            backgroundDeclineColor="#f44336"
          />
        <Slider minYear={2000} maxYear={2025} step={1} />
      </div>
    </div>
  );
};

export default TestPage;