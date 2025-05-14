// Icons for different personnel types
const PersonnelIcons = {
  regularSoldiers: '👤',
  officers: '⭐',
  seniorOfficers: '⭐⭐'
};

// Colors for different levels in the hierarchy
const getLevelColors = (level) => {
  const colorSchemes = [
    { background: '#e3f2fd', border: '#2196f3' }, // Root - blue
    { background: '#e8f5e9', border: '#4caf50' }, // Level 1 - green
    { background: '#fff3e0', border: '#ff9800' }, // Level 2 - orange
    { background: '#f3e5f5', border: '#9c27b0' }, // Level 3 - purple
    { background: '#e1f5fe', border: '#03a9f4' }, // Level 4 - light blue
  ];
  
  // Use modulo to cycle through colors if we have more levels than color schemes
  return colorSchemes[level % colorSchemes.length];
};

// Unit level icons
const getLevelIcon = (level) => {
  const icons = ['🏛️', '🏢', '🏗️', '🏠', '📍'];
  return icons[level % icons.length];
};

const TreeNode = ({ 
  unit, 
  level = 0, 
  expanded, 
  toggleExpand, 
  onSelect 
}) => {
  // Skip rendering if no unit data
  if (!unit) return null;

  const { 
    unit_id, 
    unit_name, 
    regular_soldiers, 
    officers, 
    senior_officers, 
    total_personnel, 
    sub_units 
  } = unit;

  const hasChildren = sub_units && sub_units.length > 0;
  const colors = getLevelColors(level);
  const levelIcon = getLevelIcon(level);
  
  // Function to calculate bar width as percentage
  const calculateBarWidth = (value) => {
    const max = total_personnel || 1;
    return `${(value / max) * 100}%`;
  };

  return (
    <div className="tree-node-container">
      <div 
        className="flex flex-col"
        style={{
          marginBottom: hasChildren && expanded ? '20px' : '5px',
        }}
      >
        <div 
          className="node-content relative rounded-lg p-3 mb-1 cursor-pointer"
          style={{
            backgroundColor: colors.background,
            borderLeft: `4px solid ${colors.border}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '300px',
            minWidth: '250px',
          }}
          onClick={() => onSelect(unit_id)}
        >
          {/* Unit header with expand/collapse toggle */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="mr-2 text-xl">{levelIcon}</span>
              <h3 className="font-bold text-gray-800">{unit_name}</h3>
            </div>
            {hasChildren && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent onClick
                  toggleExpand(unit_id);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                {expanded ? '−' : '+'}
              </button>
            )}
          </div>

          {/* Personnel stats with horizontal bars */}
          <div className="personnel-stats">
            <div className="text-sm text-gray-600 mb-2">
              <strong>Total: {total_personnel || 0}</strong>
            </div>
            
            {/* Regular soldiers */}
            <div className="flex items-center mb-1">
              <span className="w-6 text-center">{PersonnelIcons.regularSoldiers}</span>
              <div className="flex-1 ml-2">
                <div className="h-2 bg-gray-200 rounded">
                  <div 
                    className="h-2 bg-blue-400 rounded" 
                    style={{ width: calculateBarWidth(regular_soldiers || 0) }}
                  ></div>
                </div>
              </div>
              <span className="ml-2 text-xs">{regular_soldiers || 0}</span>
            </div>
            
            {/* Officers */}
            <div className="flex items-center mb-1">
              <span className="w-6 text-center">{PersonnelIcons.officers}</span>
              <div className="flex-1 ml-2">
                <div className="h-2 bg-gray-200 rounded">
                  <div 
                    className="h-2 bg-amber-400 rounded" 
                    style={{ width: calculateBarWidth(officers || 0) }}
                  ></div>
                </div>
              </div>
              <span className="ml-2 text-xs">{officers || 0}</span>
            </div>
            
            {/* Senior Officers */}
            <div className="flex items-center">
              <span className="w-6 text-center">{PersonnelIcons.seniorOfficers}</span>
              <div className="flex-1 ml-2">
                <div className="h-2 bg-gray-200 rounded">
                  <div 
                    className="h-2 bg-red-400 rounded" 
                    style={{ width: calculateBarWidth(senior_officers || 0) }}
                  ></div>
                </div>
              </div>
              <span className="ml-2 text-xs">{senior_officers || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeNode;