import "./UnitDetails.css";
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import OrgChart from '../visualizations/OrgChart';
import TimeGraph from '../visualizations/TimeGraph';
import PieChart from '../visualizations/PieChart';
import ControlPanel from '../layout/ControlPanel';
import DataPanel from '../layout/DataPanel';
import { getUnitByIdAndDate, getUnitTimeSeries, getUnitSubtree } from '../../api/api';
import { formatPersonnelData } from '../../utils/helpers';
import UnitCard from '../UnitCard';

const UnitDetails = () => {
  const { id } = useParams();
  const { selectedDate, units } = useData();

  const rootNodeId = Array.isArray(units) && units.length > 0
    ? units[0].unit_id
    : null;
  const effectiveId = (id === 'root' && rootNodeId) ? rootNodeId : id;

  const [unitData, setUnitData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!effectiveId || !selectedDate) return;

    const fetchUnitData = async () => {
      try {
        setLoading(true);
        const unit = await getUnitByIdAndDate(effectiveId, selectedDate);
        setUnitData(unit);
        const timeSeries = await getUnitTimeSeries(effectiveId);
        setTimeSeriesData(timeSeries);
        const subtree = await getUnitSubtree(effectiveId, selectedDate);
        setSubUnits(subtree);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching unit details:', err);
        setError('Failed to load unit details. Please try again later.');
        setLoading(false);
      }
    };

    fetchUnitData();
  }, [effectiveId, selectedDate, units]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading unit details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="unit-details-page">
      <ControlPanel 
        title="Unit Details Filters" 
        filters={[
          { name: 'Personnel Type', options: ['All', 'Regular', 'Officers', 'Senior Officers'] },
          { name: 'Unit Level',     options: ['All', 'Parent', 'Sub-units'] }
        ]}
      />

      <div className="main">
        {unitData && (
          <>
            <h1 className="text-2xl font-bold mb-6">
              {unitData.unit_name} - Unit Details ({selectedDate})
            </h1>

            <div className="overview-cards">
              <div className="overview-card">
                <h3>Regular Soldiers</h3>
                <div className="stat-value">{unitData.regular_soldiers}</div>
              </div>
              <div className="overview-card">
                <h3>Officers</h3>
                <div className="stat-value">{unitData.officers}</div>
              </div>
              <div className="overview-card">
                <h3>Senior Officers</h3>
                <div className="stat-value">{unitData.senior_officers}</div>
              </div>
              <div className="overview-card">
                <h3>Total Personnel</h3>
                <div className="stat-value">{unitData.total_personnel}</div>
              </div>
            </div>

            <div className="section">
              <h2 className="text-xl font-semibold mb-3">Unit Structure</h2>
              <div className="bg-white p-4 rounded shadow h-96">
                {Array.isArray(subUnits.sub_units) && subUnits.sub_units.length > 0 ? (
                  <OrgChart units={subUnits} rootId={effectiveId} />
                ) : (
                  <p className="text-gray-500 text-center mt-16">
                    This unit has no sub-units
                  </p>
                )}
              </div>
            </div>

            <div className="section">
              <h2 className="text-xl font-semibold mb-3">Historical Personnel Trends</h2>
              <div className="bg-white p-4 rounded shadow h-80">
                {timeSeriesData.length > 0 ? (
                  <TimeGraph data={timeSeriesData} />
                ) : (
                  <p className="text-gray-500 text-center mt-16">
                    No historical data available
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {unitData && (
        <DataPanel 
          unit={unitData}
          pieChartData={formatPersonnelData(unitData)}
          timeSeriesData={timeSeriesData}
        />
      )}
    </div>
  );
};

export default UnitDetails;
