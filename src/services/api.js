import axios from 'axios';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: '/api'
});

/**
 * Fetch all units organized hierarchically for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Promise resolving to hierarchical units data
 */
export const getAllUnits = async (date) => {
  try {
    const response = await api.get(`/units/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all units:', error);
    throw error;
  }
};

/**
 * Fetch time series data for a specific unit
 * @param {string} unitId - Unique identifier of the unit
 * @returns {Promise<Object>} - Promise resolving to unit time series data
 */
export const getUnitTimeSeries = async (unitId) => {
  try {
    const response = await api.get(`/units/${unitId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching time series for unit ${unitId}:`, error);
    throw error;
  }
};

/**
 * Fetch a specific unit by ID and date
 * @param {string} unitId - Unique identifier of the unit
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Promise resolving to unit data
 */
export const getUnitByDate = async (unitId, date) => {
  try {
    const response = await api.get(`/units/${unitId}/${date}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching unit ${unitId} for date ${date}:`, error);
    throw error;
  }
} ;

/**
 * Fetch the subtree of a specific unit, including all descendant units
 * @param {string} unitId - Unique identifier of the root unit
 * @returns {Promise<Object>} - Promise resolving to unit subtree data
 */
export const getUnitSubtree = async (unitId, date) => {
  try {
    const response = await api.get(`/subtree/units/${unitId}/${date}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subtree for unit ${unitId} on date ${date}:`, error);
    throw error;
  }
};

/**
 * Create a new unit for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} unitData - Unit data to create
 * @returns {Promise<Object>} - Promise resolving to created unit data
 */
export const createUnit = async (date, unitData) => {
  try {
    const response = await api.post(`/units/${date}`, unitData);
    return response.data;
  } catch (error) {
    console.error('Error creating unit:', error);
    throw error;
  }
};

/**
 * Update an existing unit for a specific date
 * @param {string} unitId - Unique identifier of the unit
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} unitData - Updated unit data
 * @returns {Promise<Object>} - Promise resolving to updated unit data
 */
export const updateUnit = async (unitId, date, unitData) => {
  try {
    const response = await api.put(`/units/${unitId}/${date}`, unitData);
    return response.data;
  } catch (error) {
    console.error(`Error updating unit ${unitId}:`, error);
    throw error;
  }
};

export default {
  getAllUnits,
  getUnitTimeSeries,
  getUnitByDate,
  getUnitSubtree,
  createUnit,
  updateUnit
};