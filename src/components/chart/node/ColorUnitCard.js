// unitCardTemplate.js
import { getBackgroundColor, getEllipseColor } from '../../../utils/colors';
import { getGrowthIcon, getSpecialSoldierGrowthIcon } from '../../../utils/icons';

// Helper function to format soldier count display
const formatSoldierCount = (count) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

// Helper function to determine border width based on thresholds
const getBorderWidth = (totalSoldiers) => {
  const BORDER_WIDTH_THRESHOLDS = {
    T1: 1000,
    T2: 1100,
    T3: 1200,
    T4: 1300,
    T5: 1700,
    T6: 1800,
    T7: 1900,
    T8: 2000,
  };

  const thresholds = Object.values(BORDER_WIDTH_THRESHOLDS).sort((a, b) => a - b);
  const widths = ['1px', '2px', '3px', '4px', '5px', '6px', '7px', '8px', '9px', '10px'];
  
  let borderWidth = widths[0];
  for (let i = 0; i < thresholds.length; i++) {
    if (totalSoldiers <= thresholds[i]) {
      borderWidth = widths[i];
      break;
    }
    // If above all thresholds, use the last width
    if (i === thresholds.length - 1) {
      borderWidth = widths[i + 1] || widths[widths.length - 1];
    }
  }
  return borderWidth;
};

// Helper function to determine border color and box shadow
const getBorderStyling = (unitData, rootUnit, parallelUnits, clickedNodeIds) => {
  const isRoot = unitData.id === rootUnit;
  const isParallel = parallelUnits.includes(unitData.id);
  const isClickedInArray = clickedNodeIds.includes(unitData.id);

  let borderColor = '#000'; // Default black for regular nodes
  let boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';

  if (isClickedInArray) {
    borderColor = '#ff6b35'; // Orange for clicked nodes in array
    boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3), 0 0 0 2px rgba(255, 107, 53, 0.2)';
  } else if (isRoot) {
    borderColor = '#007bff'; // Blue for root node
  } else if (isParallel) {
    borderColor = '#6f42c1'; // Purple for parallel unit nodes
  }

  return { borderColor, boxShadow };
};

// Main function to create unit card HTML
export const ColorUnitCard = (unitData, currentUnit, pastUnit, rootUnit, parallelUnits, clickedNodeIds) => {
  const currentUnitName = currentUnit.name || `Unit ${unitData.id}`;
  const currentAmount = {
    R1: currentUnit.regular_soldiers || 0,
    R2: currentUnit.officers || 0,
    R3: currentUnit.senior_officers || 0,
    Total: currentUnit.total_personnel || 0
  };
  
  const lastAmount = pastUnit ? {
    R1: pastUnit.regular_soldiers || 0,
    R2: pastUnit.officers || 0,
    R3: pastUnit.senior_officers || 0,
    Total: pastUnit.total_personnel || 0
  } : currentAmount;

  const fraction = currentAmount.Total / lastAmount.Total;
  const diff = currentAmount.Total - lastAmount.Total;
  const growthType = diff > 0 ? 'Increase' : diff < 0 ? 'Decrease' : 'Stable';
  
  const backgroundColor = getBackgroundColor(fraction);
  const growthIcon = getGrowthIcon(growthType);

  // Count soldiers in this unit's roles
  const specialSoldierCount = Object.values(unitData.roles || {}).reduce((total, soldierArray) => {
    return total + (Array.isArray(soldierArray) ? soldierArray.length : 0);
  }, 0);

  const pastSpecialSoldierCount = pastUnit ? Object.values(pastUnit.roles || {}).reduce((total, soldierArray) => {
    return total + (Array.isArray(soldierArray) ? soldierArray.length : 0);
  }, 0) : 0;

  const specialSoldierDiff = specialSoldierCount - pastSpecialSoldierCount;
  const specialGrowthIcon = getSpecialSoldierGrowthIcon(specialSoldierDiff);

  const totalSoldiers = currentAmount.Total;
  const formattedTotal = formatSoldierCount(totalSoldiers);
  const borderWidth = getBorderWidth(totalSoldiers);
  const { borderColor, boxShadow } = getBorderStyling(unitData, rootUnit, parallelUnits, clickedNodeIds);
  const ellipseColor = getEllipseColor(specialSoldierDiff);

  return `
    <div style="
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Rectangle Background -->
      <div style="
        position: absolute;
        width: 280px;
        height: 140px;
        background-color: ${ellipseColor};
        border-radius: 8px;
        opacity: 0.9;
        z-index: -1;
      "></div>
      
      <!-- Info Section (top part) -->
      <div style="
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px;
        background-color: ${backgroundColor};
        color: ${diff === 0 ? '#000' : '#fff'};
        border-radius: 6px;
        min-height: 80px;
        border: ${borderWidth} solid ${borderColor};
        width: 250px;
      ">
        <div style="
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 0px;
          display: flex;
          align-items: center;
          text-align: center;
          line-height: 1.2;
          color: black;
        ">
          ${currentUnitName.substring(0,14)}
          <span style="margin-left: 8px; font-size: 20px;">${growthIcon}</span>
        </div>
        <div style="
          font-size: 22px;
          font-weight: 700;
          color: black;
        ">
          ${formattedTotal} 
        </div>
        ${specialSoldierCount > 0 ? `
        <div style="
          font-size: 14px;
          margin-top: 4px;
          padding: 2px 6px;
          background-color: #d3d3d3;
          border-radius: 10px;
          color: ${diff === 0 ? '#333' : '#fff'};
          display: flex;
          align-items: center;
          gap: 4px;
          color: black;
        ">
          ★ ${specialSoldierCount} Talpions
          ${specialSoldierDiff !== 0 ? `<span style="margin-left: 4px; font-size: 12px; display: flex; align-items: center; gap: 2px;">${specialGrowthIcon}${specialSoldierDiff > 0 ? '+' : ''}${specialSoldierDiff}</span>` : ''}
        </div>
        ` : ''}
      </div>
    </div>
  `;
};