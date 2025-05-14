/**
 * Format date to YYYY-MM-DD format
 * @param {Date} date 
 * @returns {string} formatted date
 */
export const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

/**
 * Format personnel data for pie chart visualization
 * @param {Object} unit - Unit data with personnel counts
 * @returns {Array} formatted data for pie chart
 */
export const formatPersonnelData = (unit) => {
  if (!unit) return [];
  
  return [
    { name: 'Regular Soldiers', value: unit.regular_soldiers || 0, color: '#4299E1' },
    { name: 'Officers', value: unit.officers || 0, color: '#48BB78' },
    { name: 'Senior Officers', value: unit.senior_officers || 0, color: '#F6AD55' }
  ];
};

/**
 * Format time series data for visualization
 * @param {Array} timeSeriesData - Raw time series data
 * @returns {Array} formatted data for time graph
 */
export const formatTimeSeriesData = (timeSeriesData) => {
  if (!timeSeriesData || !Array.isArray(timeSeriesData)) return [];
  
  return timeSeriesData.map(entry => ({
    date: formatDate(entry.date),
    total: entry.total_personnel || 0,
    regular: entry.regular_soldiers || 0,
    officers: entry.officers || 0,
    seniorOfficers: entry.senior_officers || 0
  }));
};

/**
 * Filter units based on search term and filter criteria
 * @param {Array} units - Array of unit objects
 * @param {string} searchTerm - Search term to filter by
 * @param {Object} filters - Object containing filter criteria
 * @returns {Array} filtered units
 */
export const filterUnits = (units, searchTerm = '', filters = {}) => {
  if (!units || units.length === 0) return [];
  
  let filteredUnits = [...units];
  
  // Apply search term filter
  if (searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    filteredUnits = filteredUnits.filter(unit => 
      unit.name.toLowerCase().includes(searchTerm) || 
      (unit.id && unit.id.toString().includes(searchTerm))
    );
  }
  
  // Apply personnel filters
  if (filters.minRegular !== undefined && filters.minRegular !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.regular_soldiers || 0) >= filters.minRegular
    );
  }
  
  if (filters.maxRegular !== undefined && filters.maxRegular !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.regular_soldiers || 0) <= filters.maxRegular
    );
  }
  
  if (filters.minOfficers !== undefined && filters.minOfficers !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.officers || 0) >= filters.minOfficers
    );
  }
  
  if (filters.maxOfficers !== undefined && filters.maxOfficers !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.officers || 0) <= filters.maxOfficers
    );
  }
  
  if (filters.minSeniorOfficers !== undefined && filters.minSeniorOfficers !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.senior_officers || 0) >= filters.minSeniorOfficers
    );
  }
  
  if (filters.maxSeniorOfficers !== undefined && filters.maxSeniorOfficers !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.senior_officers || 0) <= filters.maxSeniorOfficers
    );
  }
  
  if (filters.minTotal !== undefined && filters.minTotal !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.total_personnel || 0) >= filters.minTotal
    );
  }
  
  if (filters.maxTotal !== undefined && filters.maxTotal !== null) {
    filteredUnits = filteredUnits.filter(unit => 
      (unit.total_personnel || 0) <= filters.maxTotal
    );
  }
  
  // Apply parent unit filter
  if (filters.parentUnit) {
    filteredUnits = filteredUnits.filter(unit => 
      unit.parent_id === filters.parentUnit
    );
  }
  
  return filteredUnits;
};

/**
 * Get the path from root to the specified unit
 * @param {Array} units - Array of unit objects with hierarchical structure
 * @param {string|number} targetUnitId - ID of the target unit
 * @returns {Array} path from root to target unit
 */
export const getUnitPath = (units, targetUnitId) => {
  if (!units || units.length === 0 || !targetUnitId) return [];
  
  const path = [];
  
  const findPath = (unitsList, currentPath) => {
    for (const unit of unitsList) {
      // Create a new path including the current unit
      const newPath = [...currentPath, unit];
      
      // Check if this is the target unit
      if (unit.id === targetUnitId) {
        path.push(...newPath);
        return true;
      }
      
      // Check sub-units if they exist
      if (unit.sub_units && unit.sub_units.length > 0) {
        if (findPath(unit.sub_units, newPath)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  findPath(units, []);
  return path;
};

/**
 * Calculate total and average statistics for a unit hierarchy
 * @param {Array} units - Array of unit objects with hierarchical structure
 * @returns {Object} statistics object
 */
export const calculateUnitStatistics = (units) => {
  if (!units || units.length === 0) {
    return {
      totalUnits: 0,
      totalPersonnel: 0,
      averagePersonnel: 0,
      totalRegular: 0,
      totalOfficers: 0,
      totalSeniorOfficers: 0
    };
  }
  
  let totalUnits = 0;
  let totalPersonnel = 0;
  let totalRegular = 0;
  let totalOfficers = 0;
  let totalSeniorOfficers = 0;
  
  const countStats = (unitsList) => {
    totalUnits += unitsList.length;
    
    unitsList.forEach(unit => {
      totalPersonnel += unit.total_personnel || 0;
      totalRegular += unit.regular_soldiers || 0;
      totalOfficers += unit.officers || 0;
      totalSeniorOfficers += unit.senior_officers || 0;
      
      if (unit.sub_units && unit.sub_units.length > 0) {
        countStats(unit.sub_units);
      }
    });
  };
  
  countStats(units);
  
  const averagePersonnel = totalUnits > 0 ? Math.round(totalPersonnel / totalUnits) : 0;
  
  return {
    totalUnits,
    totalPersonnel,
    averagePersonnel,
    totalRegular,
    totalOfficers,
    totalSeniorOfficers
  };
};