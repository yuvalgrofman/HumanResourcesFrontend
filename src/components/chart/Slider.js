// src/components/Slider.js
import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

const Slider = ({ minYear, maxYear, step = 1 }) => {
  const { selectedYear, pastYear, setSelectedYear, setPastYear } = useData();
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState(null); // 'move' | 'resize-left' | 'resize-right'

  const totalRange = maxYear - minYear;
  const widthYears = selectedYear - pastYear;

  const yearToPercent = (y) => ((y - minYear) / totalRange) * 100;
  const percentToYear = (p) => {
    const raw = minYear + (p / 100) * totalRange;
    const snapped = Math.round(raw / step) * step;
    return Math.min(Math.max(snapped, minYear), maxYear);
  };

  const onMouseDown = (e, intent) => {
    e.stopPropagation();
    setMode(intent);
    setDragging(true);
  };
  const onMouseUp = () => setDragging(false);

  const onMouseMove = (e) => {
    if (!dragging) return;
    const { left, width } = trackRef.current.getBoundingClientRect();
    let pct = ((e.clientX - left) / width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const year = percentToYear(pct);

    if (mode === 'move') {
      let newStart = year - widthYears / 2;
      newStart = Math.round(newStart / step) * step;
      newStart = Math.max(minYear, Math.min(newStart, maxYear - widthYears));
      setPastYear(newStart);
      setSelectedYear(newStart + widthYears);
    } else if (mode === 'resize-left') {
      let newStart = Math.min(year, selectedYear - step);
      newStart = Math.max(minYear, newStart);
      setPastYear(newStart);
    } else if (mode === 'resize-right') {
      let newEnd = Math.max(year, pastYear + step);
      newEnd = Math.min(maxYear, newEnd);
      setSelectedYear(newEnd);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  });

  const ticks = [];
  for (let y = minYear; y <= maxYear; y += step) ticks.push(y);

  return (
    <div className="position-relative w-100 py-3">
      <div
        ref={trackRef}
        className="bg-white border rounded position-relative"
        style={{ height: '3rem' }}
      >
        <div
          className="position-absolute d-flex"
          style={{
            left: `${yearToPercent(pastYear)}%`,
            width: `${yearToPercent(selectedYear) - yearToPercent(pastYear)}%`,
            height: '100%',
            top: 0,
            backgroundColor: 'var(--color-mid)',
            cursor: 'grab'
          }}
          onMouseDown={(e) => onMouseDown(e, 'move')}
        >
          <div
            className="bg-info"
            onMouseDown={(e) => onMouseDown(e, 'resize-left')}
            style={{
              width: '1rem',
              cursor: 'ew-resize',
              borderTopLeftRadius: '.5rem',
              borderBottomLeftRadius: '.5rem',
              marginLeft: '-.5rem'
            }}
          />
          <div
            className="bg-info ms-auto"
            onMouseDown={(e) => onMouseDown(e, 'resize-right')}
            style={{
              width: '1rem',
              cursor: 'ew-resize',
              borderTopRightRadius: '.5rem',
              borderBottomRightRadius: '.5rem',
              marginRight: '-.5rem'
            }}
          />
        </div>

        {ticks.map((y) => {
          const pct = yearToPercent(y);
          return (
            <div
              key={y}
              className="position-absolute"
              style={{
                left: `${pct}%`,
                top: 0,
                height: '100%',
                borderLeft:
                  y === minYear || y === maxYear
                    ? 'none'
                    : '1px dotted rgba(0,0,0,0.2)'
              }}
            >
              {( (y - minYear) % (step * 5) === 0 ) && (
                <span
                  className="position-absolute fw-bold"
                  style={{
                    top: '100%',
                    transform: 'translateX(-50%)',
                    fontSize: '1rem'
                  }}
                >
                  {y}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Slider;
