import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAllUnits, getUnitSubtree } from '../services/api';

// Create the context
const DataContext = createContext();

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  // return today.toISOString().split('T')[0];
  return '2024-01-01'; // For testing purposes, set a fixed date
};

// DataProvider component
export const DataProvider = ({ children }) => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all units on initial load and when selected date changes
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const data = await getAllUnits(selectedDate);
        setUnits(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch units data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [selectedDate]);

  // Fetch subtree when a unit is selected
  useEffect(() => {
    const fetchUnitSubtree = async () => {
      if (!selectedUnit) return;
      
      try {
        setLoading(true);
        const data = await getUnitSubtree(selectedUnit.unit_id, selectedDate);
        setSelectedUnit(data);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch details for unit ${selectedUnit.unit_id}. Please try again later.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedUnit && !selectedUnit.sub_units) {
      fetchUnitSubtree();
    }
  }, [selectedUnit]);

  // Calculate total personnel in a unit and its sub-units
  const calculateTotalPersonnel = (unit) => {
    if (!unit) return 0;
    
    let total = unit.total_personnel || 0;
    
    if (unit.sub_units && unit.sub_units.length > 0) {
      unit.sub_units.forEach(subUnit => {
        total += calculateTotalPersonnel(subUnit);
      });
    }
    
    return total;
  };

  // Find unit by ID in the hierarchical structure
  const findUnitById = (unitId, unitsArray = units) => {
    for (const unit of unitsArray) {
      if (unit.unit_id === unitId) {
        return unit;
      }
      
      if (unit.sub_units && unit.sub_units.length > 0) {
        const foundUnit = findUnitById(unitId, unit.sub_units);
        if (foundUnit) {
          return foundUnit;
        }
      }
    }
    
    return null;
  };

  // Select a unit by ID
  const selectUnitById = (unitId) => {
    const unit = findUnitById(unitId);
    setSelectedUnit(unit);
    return unit;
  };

  // Context value
  const value = {
    units,
    selectedUnit,
    selectedDate,
    loading,
    error,
    setSelectedDate,
    setSelectedUnit,
    selectUnitById,
    calculateTotalPersonnel,
    findUnitById
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;