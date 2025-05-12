import React from 'react';
import { useData } from '../contexts/DataContext';
import './DateSelector.css';

const DateSelector = () => {
  const { selectedDate, setSelectedDate } = useData();

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="date-selector">
      <label htmlFor="date-select">Data as of:</label>
      <input
        id="date-select"
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        max={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
};

export default DateSelector;