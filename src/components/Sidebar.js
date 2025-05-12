import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import './Sidebar.css';

const SidebarUnit = ({ unit, level = 0 }) => {
  const { selectUnitById, selectedUnit } = useData();
  const isActive = selectedUnit && selectedUnit.unit_id === unit.unit_id;

  return (
    <li className="sidebar-unit">
      <Link
        to={`/unit/${unit.unit_id}`}
        className={`sidebar-unit-link ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
        onClick={() => selectUnitById(unit.unit_id)}
      >
        {unit.unit_name}
        <span className="personnel-count">{unit.total_personnel}</span>
      </Link>
      {unit.sub_units && unit.sub_units.length > 0 && (
        <ul className="sidebar-subunits">
          {unit.sub_units.map((subUnit) => (
            <SidebarUnit key={subUnit.unit_id} unit={subUnit} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const Sidebar = () => {
  const { units, loading, error } = useData();

  if (loading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="loading-message">Loading units...</div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="error-message">{error}</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h2 className="sidebar-title">Unit Hierarchy</h2>
        <ul className="sidebar-units">
          {units.map((unit) => (
            <SidebarUnit key={unit.unit_id} unit={unit} />
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;