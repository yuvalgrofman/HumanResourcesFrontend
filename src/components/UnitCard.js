import React from 'react';
import { Link } from 'react-router-dom';
import './UnitCard.css';

const UnitCard = ({ unit }) => {
  const totalSubunits = unit.sub_units ? unit.sub_units.length : 0;

  return (
    <div className="unit-card">
      <div className="unit-card-header">
        <h3 className="unit-name">{unit.unit_name}</h3>
        <span className="unit-id">ID: {unit.unit_id}</span>
      </div>
      
      <div className="unit-card-body">
        <div className="personnel-stats">
          <div className="stat">
            <span className="stat-label">Regular Soldiers</span>
            <span className="stat-value">{unit.regular_soldiers}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Officers</span>
            <span className="stat-value">{unit.officers}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Senior Officers</span>
            <span className="stat-value">{unit.senior_officers}</span>
          </div>
          <div className="stat total">
            <span className="stat-label">Total Personnel</span>
            <span className="stat-value">{unit.total_personnel}</span>
          </div>
        </div>
        
        {unit.parent_unit_id && (
          <div className="parent-unit">
            <span className="label">Parent Unit:</span>
            <Link to={`/unit/${unit.parent_unit_id}`} className="parent-link">
              {unit.parent_unit_id}
            </Link>
          </div>
        )}
        
        <div className="subunits-info">
          <span className="label">Subunits:</span>
          <span className="value">{totalSubunits}</span>
        </div>
      </div>
      
      <Link to={`/unit/${unit.unit_id}`} className="unit-details-link">
        View Details
      </Link>
    </div>
  );
};

export default UnitCard;