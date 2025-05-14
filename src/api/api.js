import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Get all units for a specific date with hierarchical structure
export const getUnitsByDate = async (date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/units/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching units by date:', error);
    throw error;
  }
};

// Get time series data for a specific unit
export const getUnitTimeSeries = async (unitId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/units/${unitId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unit time series:', error);
    throw error;
  }
};

// Get a specific unit for a specific date
export const getUnitByIdAndDate = async (unitId, date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/units/${unitId}/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unit by ID and date:', error);
    throw error;
  }
};

// Get complete subtree of a specific unit
export const getUnitSubtree = async (unitId, date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subtree/units/${unitId}/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unit subtree:', error);
    throw error;
  }
};

// Create a new unit for a specific date
export const createUnit = async (date, unitData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/units/${date}`, unitData);
    return response.data;
  } catch (error) {
    console.error('Error creating unit:', error);
    throw error;
  }
};

// Update a specific unit for a specific date
export const updateUnit = async (unitId, date, unitData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/units/${unitId}/${date}`, unitData);
    return response.data;
  } catch (error) {
    console.error('Error updating unit:', error);
    throw error;
  }
};

export default {
  getUnitsByDate,
  getUnitTimeSeries,
  getUnitByIdAndDate,
  getUnitSubtree,
  createUnit,
  updateUnit
};