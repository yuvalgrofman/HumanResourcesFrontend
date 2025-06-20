const lightenColor = (hex, weight) => {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * weight);
  let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * weight);
  let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * weight);
  return `rgb(${r}, ${g}, ${b})`;
};

const getBackgroundColor = (diff, maxValue) => {
  const backgroundGrowthColor = '#8BC34A';
  const backgroundDeclineColor = '#E57373';
  if (diff > 0) {
    if (diff <= maxValue / 4) return lightenColor(backgroundGrowthColor, 0.6);      // Very light green
    if (diff <= maxValue / 2) return lightenColor(backgroundGrowthColor, 0.4);      // Light green
    if (diff <= (3 * maxValue) / 4) return lightenColor(backgroundGrowthColor, 0.2); // Medium green
    return backgroundGrowthColor; // Dark green
  } else if (diff < 0) {
    const abs = Math.abs(diff);
    if (abs <= maxValue / 4) return lightenColor(backgroundDeclineColor, 0.6);      // Very light red
    if (abs <= maxValue / 2) return lightenColor(backgroundDeclineColor, 0.4);      // Light red
    if (abs <= (3 * maxValue) / 4) return lightenColor(backgroundDeclineColor, 0.2); // Medium red
    return backgroundDeclineColor; // Dark red
  }
  return '#ffffff';
};

const getEllipseColor = (specialSoldierDiff, maxSpecialDiff = 10) => {
  if (specialSoldierDiff === 0) {
    return '#E0E0E0'; // Neutral gray for no change
  } else if (specialSoldierDiff > 0) {
    // Green tones for positive change
    const intensity = Math.min(Math.abs(specialSoldierDiff) / maxSpecialDiff, 1);
    if (intensity <= 0.25) return '#C8E6C9'; // Very light green
    if (intensity <= 0.5) return '#A5D6A7';  // Light green
    if (intensity <= 0.75) return '#81C784'; // Medium green
    return '#4CAF50'; // Strong green
  } else {
    // Red tones for negative change
    const intensity = Math.min(Math.abs(specialSoldierDiff) / maxSpecialDiff, 1);
    if (intensity <= 0.25) return '#FFCDD2'; // Very light red
    if (intensity <= 0.5) return '#FFAB91';  // Light red
    if (intensity <= 0.75) return '#EF5350'; // Medium red
    return '#F44336'; // Strong red
  }
};

module.exports = {
  lightenColor,
  getBackgroundColor,
  getEllipseColor
};