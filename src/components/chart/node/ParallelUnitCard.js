// ParallelUnitCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import HorizontalBar from './HorizontalBar';
import './ParallelUnitCard.css';

const ParallelUnitCard = ({
  unitName,
  currentAmount,
  lastAmount,
  growthType,
  minValue = 0,
  maxValue = 50,
  backgroundGrowthColor = '#8BC34A',
  backgroundDeclineColor  = '#E57373',
}) => {
  const currentTotal = currentAmount.Total;
  const lastTotal = lastAmount.Total;
  const diff = currentTotal - lastTotal;

  // Color utility: lighten toward white by weight [0..1]
  const lightenColor = (hex, weight) => {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) + Math.round((255 - (num >> 16)) * weight);
    let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * weight);
    let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * weight);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getBackgroundColor = () => {
    if (diff > 0) {
      // lighter shades for small increases
      if (diff <= maxValue / 3) return lightenColor(backgroundGrowthColor, 0.4);
      if (diff <= (2 * maxValue) / 3) return lightenColor(backgroundGrowthColor, 0.2);
      return backgroundGrowthColor;
    } else if (diff < 0) {
      const abs = Math.abs(diff);
      if (abs <= maxValue / 3) return lightenColor(backgroundDeclineColor, 0.4);
      if (abs <= (2 * maxValue) / 3) return lightenColor(backgroundDeclineColor, 0.2);
      return backgroundDeclineColor;
    }
    return '#ffffff';
  };

  const renderGrowthIcon = () => {
    if (growthType === 'Increase') return <FiTrendingUp />;
    if (growthType === 'Decrease') return <FiTrendingDown />;
    return <FiMinus />;
  };

  const resources = ['R1', 'R2', 'R3'];

  return (
    <div className="parallel-unit-card">
      <div
        className="info-section"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <h3 className="unit-name">
          {unitName}
          <span className="growth-icon">{renderGrowthIcon()}</span>
        </h3>
        <div className="total-amount">{currentTotal}</div>
      </div>

      <div className="bars-section-parallel card shadow-sm mt-0">
        <div className="card-body pt-0 pb-1">
          <div className="d-flex justify-content-between bars-header mb-0">
            <span className="min-value text-muted">{minValue}</span>
            <span className="max-value text-muted">{maxValue}</span>
          </div>
          {resources.map((res) => (
            <HorizontalBar
              key={res}
              nameOfBar={res}
              currentValue={currentAmount[res]}
              lastValue={lastAmount[res]}
              minValue={minValue}
              maxValue={maxValue}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

ParallelUnitCard.propTypes = {
  unitName: PropTypes.string.isRequired,
  currentAmount: PropTypes.shape({
    R1: PropTypes.number.isRequired,
    R2: PropTypes.number.isRequired,
    R3: PropTypes.number.isRequired,
    Total: PropTypes.number.isRequired,
  }).isRequired,
  lastAmount: PropTypes.shape({
    R1: PropTypes.number.isRequired,
    R2: PropTypes.number.isRequired,
    R3: PropTypes.number.isRequired,
    Total: PropTypes.number.isRequired,
  }).isRequired,
  growthType: PropTypes.oneOf(['Increase', 'Decrease', 'Stable']).isRequired,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  growthColor: PropTypes.string,
  declineColor: PropTypes.string,
  neutralColor: PropTypes.string,
};

export default ParallelUnitCard;
