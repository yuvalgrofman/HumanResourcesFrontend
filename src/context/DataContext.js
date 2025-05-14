import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUnitsByDate, getUnitTimeSeries, getUnitSubtree } from '../api/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState('2024-01-01');
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitTimeSeries, setUnitTimeSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Search units by name
  const searchUnitsByName = (searchTerm) => {
    const searchUnits = (unitsList, term) => {
      const results = [];
      
      const searchInUnit = (unit) => {
        if (unit.unit_name.toLowerCase().includes(term.toLowerCase())) {
          results.push(unit);
        }
        
        if (unit.sub_units && unit.sub_units.length > 0) {
          unit.sub_units.forEach(subUnit => {
            searchInUnit(subUnit);
          });
        }
      };
      
      unitsList.forEach(unit => {
        searchInUnit(unit);
      });
      
      return results;
    };
    
    return searchUnits(units, searchTerm);
  };

  return (
    <DataContext.Provider
      value={{
        selectedDate,
        units,
        selectedUnit,
        unitTimeSeries,
        loading,
        error,
        handleDateChange,
        selectUnit,
        searchUnitsByName
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;