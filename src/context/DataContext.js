// src/context/DataContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUnitsByDate, getUnitTimeSeries, getUnitSubtree } from '../api/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // existing date‐based state
  const [selectedDate, setSelectedDate] = useState('2024-01-01');

  // derive an initial year from the selectedDate
  const initialYear = parseInt(selectedDate.split('-')[0], 10);
  // the “currently selected” year (right edge of thumb)
  const [selectedYear, setSelectedYear] = useState(initialYear);
  // the “past” year (left edge of thumb)
  const [pastYear, setPastYear] = useState(initialYear - 2);

  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitTimeSeries, setUnitTimeSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // whenever selectedYear changes, push it into selectedDate so your effects fire
  useEffect(() => {
    setSelectedDate(`${selectedYear}-01-01`);
  }, [selectedYear]);

  // Fetch units data when selectedDate changes
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const data = await getUnitsByDate(selectedDate);
        setUnits(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch units data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [selectedDate]);

  // Fetch unit time series when selectedUnit changes
  useEffect(() => {
    if (!selectedUnit) return;

    const fetchUnitTimeSeries = async () => {
      try {
        setLoading(true);
        const data = await getUnitTimeSeries(selectedUnit.unit_id);
        setUnitTimeSeries(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch unit time series');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitTimeSeries();
  }, [selectedUnit]);

  // Handle unit selection
  const selectUnit = async (unitId) => {
    try {
      setLoading(true);
      const unitData = await getUnitSubtree(unitId, selectedDate);
      setSelectedUnit(unitData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch unit data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change (still available if you need it)
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Search units by name
  const searchUnitsByName = (searchTerm) => {
    // ... your existing implementation ...
  };

  return (
    <DataContext.Provider
      value={{
        // existing
        selectedDate,
        units,
        selectedUnit,
        unitTimeSeries,
        loading,
        error,
        handleDateChange,
        selectUnit,
        searchUnitsByName,
        // new slider state
        selectedYear,
        pastYear,
        setSelectedYear,
        setPastYear,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
