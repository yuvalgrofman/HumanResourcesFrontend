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

const generateParentColors = () => {
  return [
    // First pair from each group
    '#1e3a8a', '#3b82f6', // Deep blue to bright blue
    '#581c87', '#8b5cf6', // Deep purple to violet
    '#991b1b', '#dc2626', // Dark red to red
    '#ea580c', '#fb923c', // Dark orange to orange
    '#a16207', '#eab308', // Dark yellow to yellow
    '#14532d', '#22c55e', // Dark green to green
    '#155e75', '#06b6d4', // Dark teal to cyan
    '#1f2937', '#6b7280', // Dark gray to gray
    '#92400e', '#d97706', // Dark amber to amber
    '#7e22ce', '#a855f7', // Dark violet to violet
    '#fecaca', '#fef2f2', // Light red to very light red
    '#db2777', '#f472b6', // Deep pink to pink
    '#7c2d12', '#fed7aa', // Dark orange to peach
    '#0c4a6e', '#7dd3fc', // Deep ocean to light blue
    '#581c87', '#e879f9', // Deep purple to magenta
    
    // Second pair from each group
    '#0f172a', '#1e293b', // Navy to dark slate
    '#4c1d95', '#7c3aed', // Indigo to purple
    '#be123c', '#f43f5e', // Crimson to rose
    '#c2410c', '#f97316', // Burnt orange to orange
    '#ca8a04', '#facc15', // Gold to bright yellow
    '#166534', '#16a34a', // Forest green to green
    '#0e7490', '#22d3ee', // Teal to light cyan
    '#374151', '#9ca3af', // Slate to light gray
    '#78350f', '#a16207', // Brown to dark yellow
    '#be185d', '#ec4899', // Dark pink to hot pink
    '#ddd6fe', '#ede9fe', // Light purple to very light purple
    '#059669', '#34d399', // Emerald to light emerald
    '#991b1b', '#fbbf24', // Dark red to yellow
    '#064e3b', '#6ee7b7', // Deep forest to mint
    '#0f766e', '#5eead4', // Dark teal to aqua
    
    // Third pair from each group
    '#164e63', '#0891b2', // Dark cyan to cyan
    '#701a75', '#c084fc', // Dark magenta to light purple
    '#881337', '#e11d48', // Dark rose to pink
    '#dc2626', '#fbbf24', // Red to amber
    '#fbbf24', '#fef3c7', // Amber to cream
    '#365314', '#84cc16', // Olive to lime
    '#0369a1', '#0ea5e9', // Dark sky to sky
    '#0f172a', '#475569', // Very dark to slate
    '#451a03', '#92400e', // Dark brown to amber
    '#1e40af', '#3b82f6', // Dark blue to blue
    '#bfdbfe', '#dbeafe', // Light blue to very light blue
    '#7c2d12', '#ea580c', // Dark orange to orange
    '#be123c', '#fde047', // Rose to bright yellow
    '#1e40af', '#a7f3d0', // Deep blue to mint green
    '#b91c1c', '#fca5a5', // Dark red to light red
    
    // Fourth pair from each group
    '#ec4899', '#f9a8d4', // Hot pink to light pink
    '#f59e0b', '#fde047', // Amber to yellow
    '#064e3b', '#10b981', // Dark emerald to emerald
    '#dc2626', '#f87171', // Red to light red
    '#bbf7d0', '#dcfce7', // Light green to very light green
    '#1d4ed8', '#60a5fa', // Blue to light blue
    '#ea580c', '#fef3c7', // Orange to cream
    '#166534', '#bbf7d0', // Forest to light green
    '#1e3a8a', '#93c5fd', // Deep blue to light blue
    
    // Fifth pair from each group
    '#134e4a', '#14b8a6'  // Dark teal to teal
  ];
};

const generateFamilyColors = () => {
  return [
    // Blue family
    ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'],
    
    
    // Red family
    ['#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2', '#fffbfb', '#fffdfd'],
    
    // Purple family
    ['#581c87', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff', '#faf5ff', '#fdfdfe'],
    
    
    // Fuchsia family
    ['#86198f', '#c026d3', '#d946ef', '#e879f9', '#f0abfc', '#f5d0fe', '#fae8ff', '#fdf4ff', '#fefaff', '#fffdff'],

    // Green family
    ['#14532d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4', '#f7fef8', '#fcfefc'],

    // Pink family
    ['#be185d', '#db2777', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fdf2f8', '#fefafc', '#fffefd'],

    
    // Orange family
    ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed', '#fffbf7', '#fffefd'],
    // Teal family
    ['#134e4a', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#f0fdfa', '#f7fefd', '#fcfffe'],
    
    // Lime family
    ['#365314', '#65a30d', '#84cc16', '#a3e635', '#bef264', '#d9f99d', '#ecfccb', '#f7fee7', '#fbfef4', '#fefffa'],
    // Yellow/Amber family
    ['#92400e', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb', '#fffef7', '#fffffc'],
    // Cyan family
    ['#155e75', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe', '#ecfeff', '#f6feff', '#fcfffe'],
    
    // Stone family
    ['#44403c', '#57534e', '#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4', '#f5f5f4', '#fafaf9', '#fcfcfc', '#ffffff'],
    // Indigo family
    ['#312e81', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f0f4ff', '#f8faff', '#fcfdff'],
    
    
    // Rose family
    ['#881337', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', '#fff1f2', '#fff8f8', '#fffcfc'],
    
    // Emerald family
    ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5', '#f4fdf8', '#fbfefc'],
    
    
    // Sky family
    ['#0c4a6e', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff', '#f8fcff', '#fcfeff'],
    
    // Violet family
    ['#4c1d95', '#7c2d92', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#faf9ff', '#fefdff'],
    
    
    // Gray family
    ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#f9fafb', '#fcfcfc', '#ffffff'],
    
    // Slate family
    ['#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc', '#fcfcfd', '#ffffff'],
    
    
  ];
};

// Example usage:
// const parentColors = generateParentColors();
// console.log(parentColors[0]); // Blue family: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
// console.log(parentColors[1]); // Purple family: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff']

// To get parent color: parentColors[parentIndex][0]
// To get child colors: parentColors[parentIndex].slice(1)
// To get all colors for a parent: parentColors[parentIndex]
  
module.exports = {
  lightenColor,
  getBackgroundColor,
  getEllipseColor, 
  generateParentColors,
  generateFamilyColors
};
