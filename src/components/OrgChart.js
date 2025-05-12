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
  const [filterType, setFilterType] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const effectiveDate = selectedDate;

  const fetchUnitData = useCallback(async () => {
    if (!unit?.unit_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUnitSubtree(unit.unit_id, effectiveDate);
      const normalizedData = normalizeUnitData(data);
      setUnitData(normalizedData);
      if (normalizedData) {
        setExpandedUnits(prev => ({ ...prev, [normalizedData.unit_id]: true }));
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch unit data:', err);
      setError('Failed to load organizational chart data');
    } finally {
      setLoading(false);
    }
  }, [unit?.unit_id, effectiveDate]);

  const normalizeUnitData = (unit) => {
    if (!unit) return null;
    const normalizedUnit = { ...unit };
    if (normalizedUnit.sub_units) {
      normalizedUnit.children = normalizedUnit.sub_units.map(normalizeUnitData);
    }
    delete normalizedUnit.sub_units;
    if (normalizedUnit.children) {
      normalizedUnit.children = normalizedUnit.children.map(normalizeUnitData);
    }
    return normalizedUnit;
  };

  useEffect(() => {
    if (unit?.unit_id) {
      fetchUnitData();
    }
  }, [unit?.unit_id, effectiveDate, fetchUnitData]);

  const toggleExpand = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

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

  const renderTree = (unit) => {
    if (!unit) return null;
    const unitId = unit.unit_id;
    const isExpanded = !!expandedUnits[unitId];
    const children = unit.children || [];
    const hasChildren = children.length > 0;
    const matchesCurrentFilter = matchesFilter(unit);

    return (
      <div className="tree-node">
        <div className="unit-container">
          <div className="unit-card-wrapper">
            <div className="unit-card">
              <div className="unit-header">
                {hasChildren && (
                  <button className="toggle-button" onClick={() => toggleExpand(unitId)}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                <span className="unit-name">{unit.unit_name}</span>
              </div>
              <div className="unit-details">
                <span>Regular: {unit.regular_soldiers}</span><br />
                <span>Officers: {unit.officers}</span><br />
                <span>Senior: {unit.senior_officers}</span><br />
                <span>Total: {unit.total_personnel}</span>
              </div>
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div className="tree-branch">
              <div className="tree-line-vertical"></div>
              <div className="tree-line-horizontal">
                {children.map((child, index) => (
                  <div key={child.unit_id} className="tree-line-child">
                    <div className="tree-line-vertical"></div>
                  </div>
                ))}
              </div>
              <div className="tree-children">
                {children.map(child => (
                  <div key={child.unit_id} className="tree-child">
                    {renderTree(child)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="org-chart-container">
      <h3 className="org-chart-title">Organizational Chart</h3>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="org-chart">
          {renderTree(unitData)}
        </div>
      )}
    </div>
  );
};

export default OrgChart;
