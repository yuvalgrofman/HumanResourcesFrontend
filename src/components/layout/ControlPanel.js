import React, { useState } from 'react';
import "./ControlPanel.css";

const ControlPanel = ({ title, onFilterChange }) => {
  const [filters, setFilters] = useState({
    regularSoldiers: { min: 0, max: null },
    officers: { min: 0, max: null },
    seniorOfficers: { min: 0, max: null },
    totalPersonnel: { min: 0, max: null },
    unitName: '',
    parentUnit: ''
  });

  const handleFilterChange = (category, type, value) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        [category]: type === 'text'
          ? value
          : { ...prev[category], [type]: value === '' ? null : Number(value) }
      };
      onFilterChange && onFilterChange(updated);
      return updated;
    });
  };

  return (
    <div className="control-panel">
      <h2>{title || 'Control Panel'}</h2>

      <div className="filter-group">
        <label>Regular Soldiers</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.regularSoldiers.min || ''}
          onChange={e => handleFilterChange('regularSoldiers', 'min', e.target.value)}
          min="0"
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.regularSoldiers.max || ''}
          onChange={e => handleFilterChange('regularSoldiers', 'max', e.target.value)}
          min="0"
        />
      </div>

      <div className="filter-group">
        <label>Officers</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.officers.min || ''}
          onChange={e => handleFilterChange('officers', 'min', e.target.value)}
          min="0"
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.officers.max || ''}
          onChange={e => handleFilterChange('officers', 'max', e.target.value)}
          min="0"
        />
      </div>

      <div className="filter-group">
        <label>Senior Officers</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.seniorOfficers.min || ''}
          onChange={e => handleFilterChange('seniorOfficers', 'min', e.target.value)}
          min="0"
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.seniorOfficers.max || ''}
          onChange={e => handleFilterChange('seniorOfficers', 'max', e.target.value)}
          min="0"
        />
      </div>

      <div className="filter-group">
        <label>Total Personnel</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.totalPersonnel.min || ''}
          onChange={e => handleFilterChange('totalPersonnel', 'min', e.target.value)}
          min="0"
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.totalPersonnel.max || ''}
          onChange={e => handleFilterChange('totalPersonnel', 'max', e.target.value)}
          min="0"
        />
      </div>

      <div className="filter-group">
        <label>Unit Name</label>
        <input
          type="text"
          placeholder="Enter unit name"
          value={filters.unitName}
          onChange={e => handleFilterChange('unitName', 'text', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Parent Unit</label>
        <input
          type="text"
          placeholder="Enter parent unit"
          value={filters.parentUnit}
          onChange={e => handleFilterChange('parentUnit', 'text', e.target.value)}
        />
      </div>

      <button onClick={() => onFilterChange && onFilterChange(filters)}>
        Apply Filters
      </button>
    </div>
  );
};

export default ControlPanel;
