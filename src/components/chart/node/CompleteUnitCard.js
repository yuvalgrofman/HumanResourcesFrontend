// CompleteUnitCard.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import RightUnitCard from './RightUnitCard';
import './CompleteUnitCard.css';

const CompleteUnitCard = ({
  unitName,
  currentAmount,
  lastAmount,
  growthType,
  minValue = 0,
  maxValue = 50,
  backgroundGrowthColor = 'var(--growth-color)',
  backgroundDeclineColor = 'var(--decline-color)',
}) => {
  const currentTotal = currentAmount.Total;
  const lastTotal = lastAmount.Total;
  const diff = currentTotal - lastTotal;

  // ref + state to see if the title wrapped to 2+ lines
  const titleRef = useRef(null);
  const [isTwoLines, setIsTwoLines] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      const el = titleRef.current;
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const lines = el.offsetHeight / lineHeight;
      setIsTwoLines(lines >= 2);
    }
  }, [unitName]);

  // detect “long” title by length
  const isLongTitle = unitName.length >= 7;

  // same helper/color logic as before…
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

  return (
    <div className="complete-unit-card d-flex">
      <div
        className={`left-side${isTwoLines ? ' two-lines' : ''}`}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <h3
          ref={titleRef}
          className={`unit-name${isLongTitle ? ' long-title' : ''}`}
        >
          {unitName}
        </h3>
        <div className="total-amount">{currentTotal}</div>
        <div className="growth-icon">{renderGrowthIcon()}</div>
      </div>
      <RightUnitCard
        currentAmount={currentAmount}
        lastAmount={lastAmount}
        minValue={minValue}
        maxValue={maxValue}
      />
    </div>
  );
};

CompleteUnitCard.propTypes = {
  unitName: PropTypes.string.isRequired,
  currentAmount: PropTypes.shape({
    R1: PropTypes.number.isRequired,
    R2: PropTypes.number.isRequired,
    'R3+': PropTypes.number.isRequired,
    Total: PropTypes.number.isRequired,
  }).isRequired,
  lastAmount: PropTypes.shape({
    R1: PropTypes.number.isRequired,
    R2: PropTypes.number.isRequired,
    'R3+': PropTypes.number.isRequired,
    Total: PropTypes.number.isRequired,
  }).isRequired,
  growthType: PropTypes.oneOf(['Increase', 'Decrease', 'Stable']).isRequired,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  backgroundGrowthColorgrowthColor: PropTypes.string,
  backgroundGrowthColor: PropTypes.string,
};

export default CompleteUnitCard;
