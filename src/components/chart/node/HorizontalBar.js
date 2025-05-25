// HorizontalBar.js
import React from 'react';
import PropTypes from 'prop-types';

const HorizontalBar = ({
  minValue = 0,
  maxValue = 50,
  currentValue,
  lastValue,
  growthColor = 'var(--growth-color)',
  declineColor = 'var(--decline-color)',
  neutralColor = 'var(--neutral-color)',
  nameOfBar = 'R1',
}) => {
  const clamp = (v) => Math.min(Math.max(v, minValue), maxValue);
  const curr = clamp(currentValue);
  const last = clamp(lastValue);
  const range = maxValue - minValue;

  const equalVal = Math.min(curr, last);
  const equalPct = ((equalVal - minValue) / range) * 100;
  const diffPct  = (Math.abs(curr - last) / range) * 100;
  const currPct  = ((curr - minValue) / range) * 100;
  const lastPct  = ((last - minValue) / range) * 100;
  const diffColor = curr >= last ? growthColor : declineColor;

  return (
    <div className="d-flex align-items-center mb-2 w-100">
      <span className="me-2 fw-bold">{nameOfBar}</span>
      <div
        className="flex-grow-1 position-relative bg-white border"
        style={{ height: '20px' }}
      >
        {/* neutral segment */}
        <div
          className="position-absolute top-0 start-0 h-100"
          style={{
            width: `${equalPct}%`,
            backgroundColor: neutralColor,
          }}
        />
        {/* diff segment */}
        <div
          className="position-absolute top-0"
          style={{
            left:    `${equalPct}%`,
            width:   `${diffPct}%`,
            height:  '100%',
            backgroundColor: diffColor,
          }}
        />
        {/* current value line */}
        <div
          className="position-absolute top-0"
          style={{
            left:    `${currPct}%`,
            height:  '100%',
            borderLeft: '2px solid #000',
          }}
        />
        {/* last value line */}
        <div
          className="position-absolute top-0"
          style={{
            left:    `${lastPct}%`,
            height:  '100%',
            borderLeft: '1px dashed #000',
          }}
        />
      </div>
    </div>
  );
};

HorizontalBar.propTypes = {
  minValue:     PropTypes.number,
  maxValue:     PropTypes.number,
  currentValue: PropTypes.number.isRequired,
  lastValue:    PropTypes.number.isRequired,
  growthColor:  PropTypes.string,
  declineColor: PropTypes.string,
  neutralColor: PropTypes.string,
  nameOfBar:    PropTypes.string,
};

export default HorizontalBar;
