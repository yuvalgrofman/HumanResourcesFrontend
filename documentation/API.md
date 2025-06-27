api.js

This module encapsulates all API calls between the front-end React application and the back-end server. It provides a set of functions to fetch, create, and update data related to units (e.g., military or organizational units) for specific dates, as well as retrieving associated soldier roles and hierarchical subtrees.

Installation

The file depends on axios for HTTP requests. Make sure axios is installed in your project:

npm install axios
# or
yarn add axios

Base URL

All calls are made to the endpoint configured in API_BASE_URL:

const API_BASE_URL = 'http://localhost:8000/api';

Adjust this constant if your API lives at a different origin or path.

Exported Functions

getUnitsByDate(date)

Fetches a hierarchical list of all units on the given date.

Parameters:

date (string): A date string (e.g., "2025-06-25").

Returns: A Promise resolving to an array of units with nested child structures.

Example:

import { getUnitsByDate } from './api';

getUnitsByDate('2025-06-25')
  .then(units => console.log(units))
  .catch(err => console.error(err));

getUnitTimeSeries(unitId)

Retrieves time-series data for a specific unit by its ID, across all dates available.

Parameters:

unitId (string | number): Unique identifier of the unit.

Returns: A Promise resolving to an object with date-indexed data points.

getUnitByIdAndDate(unitId, date)

Gets the details of one unit on a particular date.

Parameters:

unitId (string | number)

date (string)

Returns: A Promise resolving to the unit object for that date.

getUnitSoldiersByRole(unitId, date)

Fetches the soldiers in the unit grouped by their roles (e.g., rifleman, medic).

Parameters:

unitId (string | number)

date (string)

Returns: A Promise resolving to a mapping of role names to arrays of soldier profiles.

getUnitWithSoldiers(unitId, date)

Combines unit details with its soldier roster on the given date.

Parameters:

unitId (string | number)

date (string)

Returns: A Promise resolving to an object containing both unit metadata and its soldiers by role.

getUnitSubtree(unitId, date)

Retrieves the complete subtree under a specific unit (i.e., all descendants) for a date.

Parameters:

unitId (string | number)

date (string)

Returns: A Promise resolving to an array of units in the subtree, each with nested children.

createUnit(date, unitData)

Creates a new unit entry for the specified date.

Parameters:

date (string)

unitData (object): The payload matching the server’s unit schema.

Returns: A Promise resolving to the newly created unit object.

updateUnit(unitId, date, unitData)

Updates an existing unit’s data for a given date.

Parameters:

unitId (string | number)

date (string)

unitData (object)

Returns: A Promise resolving to the updated unit object.

Error Handling

Each function wraps its axios call in a try/catch block. In case of network or server errors, it logs a descriptive message to console.error and rethrows the error for the caller to handle.

Usage in React Components

Import this module at the top of any React component or custom hook that needs unit data:

import React, { useEffect, useState } from 'react';
import { getUnitsByDate } from '../api';

function UnitsList({ selectedDate }) {
  const [units, setUnits] = useState([]);

  useEffect(() => {
    getUnitsByDate(selectedDate)
      .then(data => setUnits(data))
      .catch(err => /* show error UI */);
  }, [selectedDate]);

  return (
    <ul>
      {units.map(unit => (
        <li key={unit.id}>{unit.name}</li>
      ))}
    </ul>
  );
}

export default UnitsList;

This approach cleanly separates data fetching logic from presentation components, making the codebase easier to maintain and test.

