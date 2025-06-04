import "./TimeGraphPage.css";
import React from 'react';
import { useData } from '../../context/DataContext';

const TimeGraphPage = () => {
  const { loading, error } = useData();

  if (loading) return <div>Loading...</div>;
  if (error)   return <div className="text-danger">{error}</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">Time Graph</h2>
      <p className="text-muted">
        Time series visualization has been removed. This page no longer uses unit time series data.
      </p>
    </div>
  );
};

export default TimeGraphPage;
