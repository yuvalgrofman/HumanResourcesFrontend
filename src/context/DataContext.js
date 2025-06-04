// src/context/DataContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUnitsByDate, getUnitSubtree } from '../api/api';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // date state
  const [selectedDate, setSelectedDate] = useState('2024-01-01');
  
  const initialYear = parseInt(selectedDate.split('-')[0], 10);
  const [pastDate, setPastDate] = useState(`${initialYear - 2}-01-01`);

  // unit data hooks
  const [currentUnits, setCurrentUnits] = useState([]);
  const [pastUnits, setPastUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetch current units on selectedDate change
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        setLoading(true);
        const data = await getUnitsByDate(selectedDate);
        setCurrentUnits(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch current units');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrent();
  }, [selectedDate]);

  // fetch past units on pastDate change
  useEffect(() => {
    const fetchPast = async () => {
      try {
        setLoading(true);
        const data = await getUnitsByDate(pastDate);
        setPastUnits(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch past units');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPast();
  }, [pastDate]);

  // handle selecting a specific unit subtree
  const selectUnit = async (unitId) => {
    try {
      setLoading(true);
      const subtree = await getUnitSubtree(unitId, selectedDate);
      setSelectedUnit(subtree);
      setError(null);
    } catch (err) {
      setError('Failed to fetch unit data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // direct date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // search by name
  const searchUnitsByName = (searchTerm) => {
    // ...
  };

  return (
    <DataContext.Provider
      value={{
        selectedDate,
        pastDate,
        setSelectedDate,
        setPastDate,
        currentUnits,
        pastUnits,
        selectedUnit,
        loading,
        error,
        handleDateChange,
        selectUnit,
        searchUnitsByName,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
