// RightUnitCard.js
import React from 'react';
import PropTypes from 'prop-types';
import HorizontalBar from './HorizontalBar';
import './RightUnitCard.css'; // Assuming you have a CSS file for styles

const RightUnitCard = ({
  currentAmount,
  lastAmount,
  minValue = 0,
  maxValue = 50,
  growthColor,
  declineColor,
  neutralColor,
}) => {
  const resources = ['R1', 'R2', 'E+'];

  return (
    <div className="card shadow-sm mb-4 right-unit-card rounded-0 rounded-end">
      <div className="card-body pt-1 pb-1">
        {/* min/max header */}
        <div className="d-flex justify-content-between right-unit-card-header">
          <span className="min-header text-muted">{minValue}</span>
          <span className="text-muted">{maxValue}</span>
        </div>

        {/* one bar per resource */}
        {resources.map((res) => (
          <HorizontalBar
            key={res}
            nameOfBar={res}
            minValue={minValue}
            maxValue={maxValue}
            currentValue={currentAmount[res]}
            lastValue={lastAmount[res]}
            growthColor={growthColor}
            declineColor={declineColor}
            neutralColor={neutralColor}
          />
        ))}
      </div>
    </div>
  );
};

RightUnitCard.propTypes = {
  currentAmount: PropTypes.shape({
    'R1':    PropTypes.number.isRequired,
    'R2':    PropTypes.number.isRequired,
    'E+': PropTypes.number.isRequired,
  }).isRequired,
  lastAmount: PropTypes.shape({
    'R1':    PropTypes.number.isRequired,
    'R2':    PropTypes.number.isRequired,
    'E+': PropTypes.number.isRequired,
  }).isRequired,
  minValue:     PropTypes.number,
  maxValue:     PropTypes.number,
  growthColor:  PropTypes.string,
  declineColor: PropTypes.string,
  neutralColor: PropTypes.string,
};

export default RightUnitCard;
