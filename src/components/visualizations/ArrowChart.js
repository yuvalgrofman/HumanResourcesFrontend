import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import './ArrowChart.css';

// Border Width Thresholds
const BORDER_WIDTH_THRESHOLDS = {
  T1: 30,
  T2: 50,
  T3: 70,
  T4: 1150,
  T5: 1250,
  T7: 1350,
}

const ArrowChart = ({ selectedDate, pastDate, rootUnit, childUnits, parallelUnits, clickedNodeID, setClickedNodeID, levels = 3, arrowFilterValue = 0 }) => {
  const { currentUnits, pastUnits } = useData();
  const [flatCurrentUnits, setFlatCurrentUnits] = useState([]);
  const [flatPastUnits, setFlatPastUnits] = useState([]);
  const [soldierMovements, setSoldierMovements] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showStructure, setshowStructure] = useState(true);
  const [clickedNodeIds, setClickedNodeIds] = useState([]);
  const [showClickedArrows, setShowClickedArrows] = useState(false);
  const svgRef = useRef();
  const containerRef = useRef();

  // Handle node click
  const handleNodeClick = (nodeId) => {
    setClickedNodeID(nodeId);
    
    // Toggle nodeId in clickedNodeIds array
    setClickedNodeIds(prevIds => {
      if (prevIds.includes(nodeId)) {
        // If nodeId is already present, remove it
        let newIds = prevIds.filter(id => id !== nodeId);
        console.log('clickedNodeIds', newIds);
        // Remove if already present
        return prevIds.filter(id => id !== nodeId);
      } else {
        // Add if not present
        let newIds = [...prevIds, nodeId];
        console.log('clickedNodeIds', newIds);
        return [...prevIds, nodeId];
      }
    });

  };

  // Toggle clicked arrows visibility
  const toggleClickedArrows = () => {
    setShowClickedArrows(prev => !prev);
  };

  // Flatten the hierarchical units structure
  const flattenUnits = (units) => {
    const result = [];
    const traverse = (unitList) => {
      if (!unitList || !Array.isArray(unitList)) return;
      unitList.forEach(unit => {
        result.push({
          id: unit.unit_id,
          name: unit.unit_name,
          parent_id: unit.parent_unit_id,
          regular_soldiers: unit.regular_soldiers || 0,
          officers: unit.officers || 0,
          senior_officers: unit.senior_officers || 0,
          total_personnel: unit.total_personnel * 10 || 0,
          // total_personnel: unit.total_personnel || 0,
          date: unit.date,
          roles: unit.roles || {},
        });
        if (unit.sub_units && unit.sub_units.length > 0) {
          traverse(unit.sub_units);
        }
      });
    };
    if (Array.isArray(units)) {
      traverse(units);
    } else if (units && typeof units === 'object') {
      traverse([units]);
    }
    return result;
  };

  // Calculate soldier movements between time periods
  const calculateSoldierMovements = (currentUnits, pastUnits) => {
    const movements = [];
    
    if (!currentUnits || !pastUnits) return movements;

    // Create maps of soldier ID to unit ID for both time periods
    const currentSoldierToUnit = new Map();
    const pastSoldierToUnit = new Map();

    // Build current period soldier-to-unit mapping
    currentUnits.forEach(unit => {
      if (unit.roles) {
        Object.entries(unit.roles).forEach(([roleType, soldierIds]) => {
          if (Array.isArray(soldierIds)) {
            soldierIds.forEach(soldierId => {
              currentSoldierToUnit.set(soldierId, {
                unitId: unit.id,
                unitName: unit.name,
                roleType: roleType
              });
            });
          }
        });
      }
    });

    // Build past period soldier-to-unit mapping
    pastUnits.forEach(unit => {
      if (unit.roles) {
        Object.entries(unit.roles).forEach(([roleType, soldierIds]) => {
          if (Array.isArray(soldierIds)) {
            soldierIds.forEach(soldierId => {
              pastSoldierToUnit.set(soldierId, {
                unitId: unit.id,
                unitName: unit.name,
                roleType: roleType
              });
            });
          }
        });
      }
    });

    // Group movements by unit pairs
    const movementGroups = new Map();

    // Find movements by comparing current and past positions
    currentSoldierToUnit.forEach((currentInfo, soldierId) => {
      const pastInfo = pastSoldierToUnit.get(soldierId);
      
      if (pastInfo && pastInfo.unitId !== currentInfo.unitId) {
        const key = `${pastInfo.unitId}->${currentInfo.unitId}`;
        if (!movementGroups.has(key)) {
          movementGroups.set(key, {
            fromUnit: pastInfo.unitId,
            fromUnitName: pastInfo.unitName,
            toUnit: currentInfo.unitId,
            toUnitName: currentInfo.unitName,
            soldiers: [],
            movementType: 'transfer'
          });
        }
        movementGroups.get(key).soldiers.push(soldierId);
      }
    });

    // Find soldiers who left the organization
    pastSoldierToUnit.forEach((pastInfo, soldierId) => {
      if (!currentSoldierToUnit.has(soldierId)) {
        const key = `${pastInfo.unitId}->departure`;
        if (!movementGroups.has(key)) {
          movementGroups.set(key, {
            fromUnit: pastInfo.unitId,
            fromUnitName: pastInfo.unitName,
            toUnit: null,
            toUnitName: 'Left Organization',
            soldiers: [],
            movementType: 'departure'
          });
        }
        movementGroups.get(key).soldiers.push(soldierId);
      }
    });

    // Find new soldiers who joined the organization
    currentSoldierToUnit.forEach((currentInfo, soldierId) => {
      if (!pastSoldierToUnit.has(soldierId)) {
        const key = `recruitment->${currentInfo.unitId}`;
        if (!movementGroups.has(key)) {
          movementGroups.set(key, {
            fromUnit: null,
            fromUnitName: 'New Recruit',
            toUnit: currentInfo.unitId,
            toUnitName: currentInfo.unitName,
            soldiers: [],
            movementType: 'recruitment'
          });
        }
        movementGroups.get(key).soldiers.push(soldierId);
      }
    });

    // Convert groups to movements array with soldier count
    movementGroups.forEach(group => {
      movements.push({
        ...group,
        soldierCount: group.soldiers.length,
        soldierIds: group.soldiers
      });
    });

    return movements;
  };

  // Update flattened units when data changes
  useEffect(() => {
    if (currentUnits && currentUnits.length > 0) {
      setFlatCurrentUnits(flattenUnits(currentUnits));
    }
  }, [currentUnits]);

  useEffect(() => {
    if (pastUnits && pastUnits.length > 0) {
      setFlatPastUnits(flattenUnits(pastUnits));
    }
  }, [pastUnits]);

  // Calculate soldier movements when units change
  useEffect(() => {
    if (flatCurrentUnits.length > 0 && flatPastUnits.length > 0) {
      const movements = calculateSoldierMovements(flatCurrentUnits, flatPastUnits);
      setSoldierMovements(movements);
    }
  }, [flatCurrentUnits, flatPastUnits]);

  // Full screen toggle
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
    // Reset zoom and pan when toggling full screen
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Toggle movement arrows visibility
  const toggleStructure = () => {
    setshowStructure(prev => !prev);
  };

  // Handle escape key to exit full screen
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isFullScreen]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  const handleZoomReset = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };

  // Pan controls
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };
  const handleMouseUp = () => setIsPanning(false);

  // Keyboard zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); }
        else if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
        else if (e.key === '0') { e.preventDefault(); handleZoomReset(); }
      }
      // F11 or F key for full screen toggle
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullScreen();
      }
      // M key to toggle movement arrows
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleStructure();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.deltaY < 0 ? handleZoomIn() : handleZoomOut();
    }
  };

  const findUnitById = (units, unitId) => units.find(unit => unit.id === unitId);

  const convertToCardFormat = (unit) => {
    if (!unit) return { R1: 0, R2: 0, R3: 0, Total: 0 };
    return {
      R1: unit.regular_soldiers || 0,
      R2: unit.officers || 0,
      R3: unit.senior_officers || 0,
      Total: unit.total_personnel || 0
    };
  };

  const getGrowthType = (current, past) => {
    if (!current || !past) return 'Stable';
    const currentTotal = current.Total || 0;
    const pastTotal = past.Total || 0;
    if (currentTotal > pastTotal) return 'Increase';
    if (currentTotal < pastTotal) return 'Decrease';
    return 'Stable';
  };



  // Utility functions for styling (from ParallelUnitCard)
  const lightenColor = (hex, weight) => {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) + Math.round((255 - (num >> 16)) * weight);
    let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * weight);
    let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * weight);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getBackgroundColor = (diff, maxValue = 50) => {
    const backgroundGrowthColor = '#8BC34A';
    const backgroundDeclineColor = '#E57373';
    
    if (diff > 0) {
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

  const getGrowthIcon = (growthType) => {
    if (growthType === 'Increase') {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>';
    } else if (growthType === 'Decrease') {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>';
    } else {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    }
  };

  const getSpecialSoldierGrowthIcon = (diff) => {
    if (diff > 0) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>';
    } else if (diff < 0) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>';
    } else {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    }
  };

  // Calculate ellipse color based on special soldier difference
  const getEllipseColor = (specialSoldierDiff, maxSpecialDiff = 10) => {
    if (specialSoldierDiff === 0) {
      return '#E0E0E0'; // Neutral gray for no change
    } else if (specialSoldierDiff > 0) {
      // Green tones for positive change
      const intensity = Math.min(Math.abs(specialSoldierDiff) / maxSpecialDiff, 1);
      if (intensity <= 0.33) return '#C8E6C9'; // Light green
      if (intensity <= 0.66) return '#81C784'; // Medium green
      return '#4CAF50'; // Strong green
    } else {
      // Red tones for negative change
      const intensity = Math.min(Math.abs(specialSoldierDiff) / maxSpecialDiff, 1);
      if (intensity <= 0.33) return '#FFCDD2'; // Light red
      if (intensity <= 0.66) return '#EF5350'; // Medium red
      return '#F44336'; // Strong red
    }
  };

  // Get arrow styling based on soldier count
  const getArrowStyling = (soldierCount) => {
    // Color intensity and stroke width based on number of soldiers
    let strokeWidth, strokeColor, opacity;
    
    if (soldierCount <= 2) {
      strokeWidth = '1px';
      strokeColor = '#90A4AE'; // Light gray for small movements
      opacity = 0.6;
    } else if (soldierCount <= 5) {
      strokeWidth = '2px';
      strokeColor = '#5C6BC0'; // Medium blue
      opacity = 0.7;
    } else if (soldierCount <= 10) {
      strokeWidth = '3px';
      strokeColor = '#3F51B5'; // Darker blue
      opacity = 0.8;
    } else {
      strokeWidth = '4px';
      strokeColor = '#1A237E'; // Very dark blue for large movements
      opacity = 0.9;
    }
    
    return { strokeWidth, strokeColor, opacity };
  };

  // Helper function to limit tree depth based on levels prop
  const limitTreeDepth = (node, currentDepth = 0) => {
    if (currentDepth >= levels - 1) {
      // Return node without children if we've reached the depth limit
      return { ...node, children: [] };
    }
    
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(child => limitTreeDepth(child, currentDepth + 1))
      };
    }
    
    return node;
  };

  // Build tree structure for D3
  const buildTreeData = useMemo(() => {
    if (!flatCurrentUnits.length) return null;
    
    const unitMap = new Map();
    flatCurrentUnits.forEach(unit => {
      unitMap.set(unit.id, { ...unit, children: [] });
    });
    
    // Build the tree structure
    flatCurrentUnits.forEach(unit => {
      if (unit.parent_id && unitMap.has(unit.parent_id)) {
        // If this is the root unit, only add children that are in childUnits
        if (unit.parent_id === rootUnit) {
          if (childUnits.includes(unit.id)) {
            unitMap.get(unit.parent_id).children.push(unitMap.get(unit.id));
          }
        } else if (!parallelUnits.includes(unit.parent_id)) {
          // For non-root units, only add children if the parent is NOT a parallel unit
          unitMap.get(unit.parent_id).children.push(unitMap.get(unit.id));
        }
      }
    });
    
    const rootData = unitMap.get(rootUnit);
    if (!rootData) return null;
    
    // Add parallel units as siblings to root (without their children)
    const parallelNodes = parallelUnits
      .filter(id => unitMap.has(id) && id !== rootUnit)
      .map((id, index) => {
        const parallelUnit = unitMap.get(id);
        // Return parallel unit without children and with position info
        return {
          ...parallelUnit,
          children: [],
          isParallel: true,
          parallelIndex: index
        };
      });
    
    let treeData;
    if (parallelNodes.length > 0) {
      // Create a virtual root to hold both root and parallel units
      // Arrange children with root in center and parallel units around it
      treeData = {
        id: 'virtual-root',
        name: 'Organization',
        isVirtual: true,
        children: [rootData, ...parallelNodes]
      };
    } else {
      treeData = rootData;
    }
    
    // Apply depth limitation to the entire tree
    return limitTreeDepth(treeData);
  }, [flatCurrentUnits, rootUnit, parallelUnits, childUnits, levels]);

  // Get movement statistics
  const movementStats = useMemo(() => {
    const transfers = soldierMovements.filter(m => m.movementType === 'transfer');
    const departures = soldierMovements.filter(m => m.movementType === 'departure');
    const recruitments = soldierMovements.filter(m => m.movementType === 'recruitment');
    
    const totalSoldiers = soldierMovements.reduce((sum, m) => sum + m.soldierCount, 0);
    const transferSoldiers = transfers.reduce((sum, m) => sum + m.soldierCount, 0);
    const departureSoldiers = departures.reduce((sum, m) => sum + m.soldierCount, 0);
    const recruitmentSoldiers = recruitments.reduce((sum, m) => sum + m.soldierCount, 0);
    
    return {
      totalArrows: soldierMovements.length,
      totalSoldiers,
      transfers: transfers.length,
      transferSoldiers,
      departures: departures.length,
      departureSoldiers,
      recruitments: recruitments.length,
      recruitmentSoldiers
    };
  }, [soldierMovements]);

  // D3 Tree rendering
  useEffect(() => {
    if (!buildTreeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Set up dimensions for ParallelUnitCard-style nodes
    const nodeWidth = 300;
    const nodeHeight = 200;
    const levelHeight = 250;

    // Create tree layout
    const treeLayout = d3.tree()
      .nodeSize([nodeWidth + 40, levelHeight])
      .separation((a, b) => 1);

    // Create hierarchy
    const root = d3.hierarchy(buildTreeData);
    const treeData = treeLayout(root);

    // Create node position map for movement arrows
    const nodePositions = new Map();

    // Custom positioning for parallel units
    if (buildTreeData.isVirtual) {
      const virtualRoot = treeData;
      const children = virtualRoot.children;
      
      // Find root node (the actual root unit, not parallel units)
      const rootNode = children.find(child => child.data.id === rootUnit);
      const parallelNodes = children.filter(child => child.data.isParallel);
      
      if (rootNode && parallelNodes.length > 0) {
        // Position root node at center
        rootNode.x = 0;
        rootNode.y = 0;
        
        // Position parallel units horizontally around root
        const horizontalSpacing = nodeWidth + 80; // Space between parallel units
        
        parallelNodes.forEach((node, index) => {
          // Alternate right and left: right for even indices, left for odd
          const isRight = index % 2 === 0;
          const distanceFromCenter = Math.floor(index / 2) + 1;
          
          node.x = isRight ? 
            horizontalSpacing * distanceFromCenter : 
            -horizontalSpacing * distanceFromCenter;
          node.y = 0; // Same level as root
        });
      }
    }

    // Store node positions for movement arrows
    treeData.descendants().forEach(d => {
      if (!d.data.isVirtual) {
        nodePositions.set(d.data.id, {
          x: d.x,
          y: d.y + 35, // This should be the top-left of the node
          width: nodeWidth,
          height: nodeHeight
        });
      }
    });

    // Calculate bounds after custom positioning
    let minX = Infinity, maxX = -Infinity;
    treeData.descendants().forEach(d => {
      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x);
    });
    
    const treeWidth = maxX - minX + nodeWidth;
    const treeHeight = (treeData.height + 1) * levelHeight;
    
    // Set SVG dimensions
    svg.attr('width', Math.max(treeWidth + 200, containerWidth))
       .attr('height', Math.max(treeHeight + 200, containerHeight));

    // Define arrow markers
    const defs = svg.append('defs');
    
    // Transfer arrow marker (blue)
    defs.append('marker')
      .attr('id', 'arrow-transfer')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#2196F3');

    // Departure arrow marker (red)
    defs.append('marker')
      .attr('id', 'arrow-departure')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#F44336');

    // Recruitment arrow marker (green)
    defs.append('marker')
      .attr('id', 'arrow-recruitment')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#4CAF50');

    // Create main group for zoom/pan
    const g = svg.append('g')
      .attr('class', 'tree-container')
      .attr('transform', `translate(${treeWidth/2 + 100},100)`);



    // Add nodes
    const nodes = g.selectAll('.node')
      .data(treeData.descendants().filter(d => !d.data.isVirtual))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x - nodeWidth/2},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        handleNodeClick(d.data.id);
      });

    // Add foreign object for ParallelUnitCard-style components
    nodes.append('foreignObject')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .each(function(d) {
        const unitData = d.data;
        const currentUnit = unitData;
        const currentUnitName = currentUnit.name || `Unit ${unitData.id}`;
        const pastUnit = findUnitById(flatPastUnits, unitData.id);
        const currentAmount = convertToCardFormat(currentUnit);
        const lastAmount = convertToCardFormat(pastUnit) || currentAmount;
        const growthType = getGrowthType(currentAmount, lastAmount);
        
        const isRoot = unitData.id === rootUnit;
        const isParallel = parallelUnits.includes(unitData.id);
        const isClicked = clickedNodeID === unitData.id;
        
        const diff = currentAmount.Total - lastAmount.Total;
        const backgroundColor = getBackgroundColor(diff);
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

        // Format total soldiers display
        const formatSoldierCount = (count) => {
          if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
          }
          return count.toString();
        };
        
        const totalSoldiers = currentAmount.Total;
        const formattedTotal = formatSoldierCount(totalSoldiers);

        // Determine border color based on node type and clicked state
        // Dynamically determine border width based on thresholds
        let borderWidth;
        const thresholds = Object.values(BORDER_WIDTH_THRESHOLDS).sort((a, b) => a - b);
        const widths = ['1px', '2px', '3px', '4px', '5px', '6px', '7px', '8px', '9px', '10px'];
        borderWidth = widths[0];
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
        
        // Determine border color based on node type and clicked state
        let borderColor = '#000'; // Default black for regular nodes
        let boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';

        const isClickedInArray = clickedNodeIds.includes(unitData.id);

        if (isClickedInArray) {
          borderColor = '#ff6b35'; // Orange for clicked nodes in array
          boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3), 0 0 0 2px rgba(255, 107, 53, 0.2)';
        } else if (isRoot) {
          borderColor = '#007bff'; // Blue for root node
        } else if (isParallel) {
          borderColor = '#6f42c1'; // Purple for parallel unit nodes
        }
        
        // Get ellipse color based on special soldier difference
        const ellipseColor = getEllipseColor(specialSoldierDiff);
        
        // Create ParallelUnitCard-style HTML with special soldiers info and ellipse background
        this.innerHTML = `
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
                ">
                  ${currentUnitName}
                  <span style="margin-left: 8px; font-size: 20px;">${growthIcon}</span>
                </div>
                <div style="
                  font-size: 22px;
                  font-weight: 700;
                ">
                  ${formattedTotal} 
                </div>
                ${specialSoldierCount > 0 ? `
                <div style="
                  font-size: 14px;
                  margin-top: 4px;
                  padding: 2px 6px;
                  background-color: rgba(255,255,255,0.2);
                  border-radius: 10px;
                  color: ${diff === 0 ? '#333' : '#fff'};
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  ★ ${specialSoldierCount} Talpions
                  ${specialSoldierDiff !== 0 ? `<span style="margin-left: 4px; font-size: 12px; display: flex; align-items: center; gap: 2px;">${specialGrowthIcon}${specialSoldierDiff > 0 ? '+' : ''}${specialSoldierDiff}</span>` : ''}
                </div>
                ` : ''}
              </div>
            </div>
        `;
      });

    // Add links (connections between nodes)
    // Only show links from root to its children, not to parallel units
    if (showStructure) {
      const links = g.selectAll('.link')
        .data(treeData.links().filter(d => 
          !d.source.data.isVirtual && 
          !d.target.data.isParallel
        ))
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d => {
          const source = d.source;
          const target = d.target;
          return `M${source.x},${source.y + nodeHeight/2 + 60}
                  L${source.x},${source.y + nodeHeight/2 + 78}
                  L${target.x},${target.y + 12}
                  L${target.x},${target.y + 40}`;
        })
        .style('fill', 'none')
        .style('stroke', '#37B7C3')
        .style('stroke-width', '2px');
    }

    if (soldierMovements.length > 0) {
      const movementArrows = g.selectAll('.movement-arrow')
        .data(soldierMovements.filter(movement => {
          // Only show movements between visible nodes
          const isVisibleMovement = movement.fromUnit && movement.toUnit
            && nodePositions.has(movement.fromUnit)
            && nodePositions.has(movement.toUnit)
            && movement.soldierCount > arrowFilterValue;
          
          if (!isVisibleMovement) return false;
          
          // Check if both nodes are on the same level
          const fromPos = nodePositions.get(movement.fromUnit);
          const toPos = nodePositions.get(movement.toUnit);
          
          if (!fromPos || !toPos) return false;
          
          // Consider nodes to be on the same level if their Y positions are within a threshold
          const levelThreshold = 100; // Adjust this value based on your layout
          const isSameLevel = Math.abs(fromPos.y - toPos.y) < levelThreshold;
          
          if (!isSameLevel) return false;
          
          // If showClickedArrows is true, only show arrows for clicked units
          if (showClickedArrows) {
            return clickedNodeIds.includes(movement.fromUnit) || 
                   clickedNodeIds.includes(movement.toUnit);
          }
          
          return true;
        }))
        .enter()
        .append('g')
        .attr('class', 'movement-arrow');

      movementArrows.each(function(d) {
        const fromPos = nodePositions.get(d.fromUnit);
        const toPos = nodePositions.get(d.toUnit);
        
        if (!fromPos || !toPos) return;

        // Get arrow styling based on soldier count
        const arrowStyle = getArrowStyling(d.soldierCount);

        // Calculate connection points on card edges (not centers)
        const cardMargin = 20; // Distance from card edge where arrow should end
        
        // Calculate connection points: from top/bottom middle to left/right middle
        let startX, startY, endX, endY;

        const fromCenterX = fromPos.x;
        const fromCenterY = fromPos.y + fromPos.height / 2;
        const toCenterX = toPos.x;
        const toCenterY = toPos.y + toPos.height / 2;

        // Determine if target is above or below source
        const isTargetBelow = toCenterY > fromCenterY;
        const isTargetRight = toCenterX > fromCenterX;
        const heightDifference = Math.abs(fromPos.y - toPos.y);
        const isSameLevel = heightDifference < 100; // Threshold for considering nodes at same level

        if (isSameLevel) {
          // For same-level nodes, connect from top-middle to top-middle
          startX = fromCenterX;
          startY = fromPos.y - 20;
          endX = toCenterX;
          endY = toPos.y - 12;
        } else if (isTargetBelow) {
          startX = fromCenterX;
          startY = fromPos.y + 140; // Bottom middle of source card
          endX = toCenterX;
          endY = toPos.y - 8; // Top middle of target card
        } else {
          startX = fromCenterX;
          startY = fromPos.y - 20; // Top middle of source card
          endX = toCenterX;
          endY = toPos.y + 125; // Bottom middle of target card
        }

        // Create curved path with smooth transition
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Check if nodes are at approximately the same height (same level in tree)
        let controlX, controlY;

        if (isSameLevel) {
          // For same-level nodes: create a large upward arc
          controlX = midX;
          
          // Calculate large upward control point
          const horizontalDistance = Math.abs(endX - startX);
          const baseArcHeight = Math.max(80, horizontalDistance * 0.4); // Minimum 80px arc height
          const maxArcHeight = 150; // Maximum arc height
          const arcHeight = Math.min(baseArcHeight, maxArcHeight);
          
          // Control point goes significantly upward from the midpoint
          controlY = Math.min(startY, endY) - arcHeight;
          
          // For very close nodes, make an even more pronounced arc
          if (horizontalDistance < 200) {
            controlY = Math.min(startY, endY) - (arcHeight + 40);
          }
        } else if (isTargetBelow) {
          // For different-level nodes: use gentle curve as before
          const curvature = Math.min(Math.abs(endX - startX) * 0.3, 50);
          controlX = midX;
          controlY = midY - curvature; // Gentle upward curve
        } else {
          const curvature = - Math.min(Math.abs(endX - startX) * 0.3, 50);
          controlX = midX;
          controlY = midY - curvature; // Gentle upward curve
        }

        const pathData = `M${startX},${startY} Q${controlX},${controlY} ${endX},${endY}`;
        
        // Determine movement type styling
        let strokeDasharray, markerId;
        switch (d.movementType) {
          case 'transfer':
            strokeDasharray = 'none';
            markerId = 'arrow-transfer';
            break;
          case 'departure':
            strokeDasharray = '8,4';
            markerId = 'arrow-departure';
            break;
          case 'recruitment':
            strokeDasharray = '12,3';
            markerId = 'arrow-recruitment';
            break;
          default:
            strokeDasharray = 'none';
            markerId = 'arrow-transfer';
        }

        // ADD GREY DOT AT START OF ARROW (NEW CODE)
        // Calculate dot size based on soldier count (3-15px radius)
        const dotRadius = Math.min(Math.max(3 + (d.soldierCount * 0.3), 3), 15);
        
        // Add grey dot at the start of the arrow
        d3.select(this)
          .append('circle')
          .attr('cx', startX)
          .attr('cy', startY)
          .attr('r', dotRadius)
          .attr('fill', '#808080') // Grey color
          .attr('stroke', '#666666') // Darker grey border
          .attr('stroke-width', '1px')
          .attr('opacity', 0.8)
          .append('title')
          .text(`${d.soldierCount} soldier${d.soldierCount !== 1 ? 's' : ''} leaving from ${d.fromUnitName}`);

      const arrowPath = d3.select(this)
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', arrowStyle.strokeColor)
        .attr('stroke-width', arrowStyle.strokeWidth)
        .attr('stroke-dasharray', strokeDasharray)
        .attr('marker-end', `url(#${markerId})`)
        .attr('opacity', arrowStyle.opacity)
        .style('cursor', 'pointer') // Add cursor pointer for better UX
        .on('mouseenter', function(event) {
          // Highlight the arrow on hover
          d3.select(this)
            .attr('stroke-width', parseFloat(arrowStyle.strokeWidth) + 2) // Make arrow thicker
            .attr('opacity', Math.min(arrowStyle.opacity + 0.3, 1)); // Make more opaque
          
          // Create tooltip
          const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'arrow-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '6px')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('max-width', '300px')
            .style('opacity', '0')
            .html(`
              <div style="margin-bottom: 6px; font-weight: bold; color: ${
                d.movementType === 'transfer' ? '#64B5F6' : 
                d.movementType === 'departure' ? '#EF5350' : '#81C784'
              };">
                ${d.movementType.toUpperCase()}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>From:</strong> ${d.fromUnitName || 'Unknown'}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>To:</strong> ${d.toUnitName || 'Unknown'}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Personnel:</strong> ${d.soldierCount} soldier${d.soldierCount !== 1 ? 's' : ''}
              </div>
              ${d.soldierIds && d.soldierIds.length > 0 ? `
              <div style="font-size: 12px; color: #ccc; margin-top: 6px;">
                IDs: ${d.soldierIds.slice(0, 5).join(', ')}${d.soldierIds.length > 5 ? '...' : ''}
              </div>
              ` : ''}
            `);
          
          // Position tooltip near mouse
          tooltip.transition()
            .duration(200)
            .style('opacity', '1');
            
          // Update tooltip position on mouse move
          const updateTooltipPosition = (event) => {
            tooltip
              .style('left', (event.pageX + 15) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          };
          
          updateTooltipPosition(event);
          d3.select(this).on('mousemove.tooltip', updateTooltipPosition);
        })
        .on('mouseleave', function() {
          // Reset arrow appearance
          d3.select(this)
            .attr('stroke-width', arrowStyle.strokeWidth) // Reset thickness
            .attr('opacity', arrowStyle.opacity); // Reset opacity
          
          // Remove tooltip
          d3.selectAll('.arrow-tooltip').remove();
          
          // Remove mousemove listener
          d3.select(this).on('mousemove.tooltip', null);
        });

        // Add tooltip with soldier count and details
        arrowPath.append('title')
          .text(`${d.movementType.toUpperCase()}: ${d.soldierCount} soldier${d.soldierCount !== 1 ? 's' : ''} from ${d.fromUnitName} to ${d.toUnitName}`);
      });
    }

    // Apply zoom and pan transforms
    g.attr('transform', 
      `translate(${treeWidth/2 + 100 + panOffset.x / zoomLevel},${100 + panOffset.y / zoomLevel}) scale(${zoomLevel})`
    );

    }, [buildTreeData, flatPastUnits, rootUnit, parallelUnits, zoomLevel, panOffset, clickedNodeID, soldierMovements, showStructure, arrowFilterValue, levels, clickedNodeIds, showClickedArrows]);

  if (!buildTreeData) {
    return (
      <div className={`arrow-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
        <div className="arrow-chart-message">
          <p>Please select a root unit to display the organizational chart.</p>
        </div>
      </div>
    );
  }

  const totalNodes = flatCurrentUnits.length;
  const maxDepth = buildTreeData ? d3.hierarchy(buildTreeData).height + 1 : 0;
  const displayedDepth = Math.min(maxDepth, levels);
  
  return (
    <div className={`arrow-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
      <div className="arrow-chart-header">
        <div className="header-info">
          <h3>Organizational Structure</h3>
          <p>{displayedDepth} levels • {totalNodes} total units • Showing {levels} level{levels !== 1 ? 's' : ''}</p>
          {clickedNodeID && (
            <p style={{ color: '#ff6b35', fontWeight: 'bold' }}>
              Selected: {flatCurrentUnits.find(u => u.id === clickedNodeID)?.name || clickedNodeID}
            </p>
          )}
          {movementStats.totalSoldiers > 0 && (
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              {movementStats.totalSoldiers} soldiers moved • {movementStats.transferSoldiers} transfers • {movementStats.recruitmentSoldiers} new • {movementStats.departureSoldiers} departed
            </div>
          )}
        </div>
        <div className="header-controls">
          <div className="movement-controls">
            <button 
              className={`movement-toggle-btn ${showStructure ? 'active' : ''}`}
              onClick={toggleStructure}
              title="Toggle soldier movement arrows (M)"
              style={{
                padding: '6px 12px',
                marginRight: '8px',
                backgroundColor: showStructure ? '#2196F3' : '#f0f0f0',
                color: showStructure ? 'white' : '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showStructure ? '👁️ Hide Structure' : '👁️ Show Structure'}
            </button>
            <button 
              className={`movement-toggle-btn ${showClickedArrows ? 'active' : ''}`}
              onClick={toggleClickedArrows}
              title="Toggle between showing all arrows or only clicked unit arrows"
              style={{
                padding: '6px 12px',
                marginRight: '8px',
                backgroundColor: showClickedArrows ? '#ff6b35' : '#f0f0f0',
                color: showClickedArrows ? 'white' : '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showClickedArrows ?  '🌐 Show All' : '🎯 Show Clicked'}
            </button>
          </div>
          <div className="zoom-controls">
            <button className="zoom-btn zoom-out" onClick={handleZoomOut} title="Zoom Out (Ctrl + -)" disabled={zoomLevel <= 0.3}>−</button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button className="zoom-btn zoom-in" onClick={handleZoomIn} title="Zoom In (Ctrl + +)" disabled={zoomLevel >= 3}>+</button>
            <button className="zoom-btn zoom-reset" onClick={handleZoomReset} title="Reset Zoom (Ctrl + 0)">Reset</button>
          </div>
          <button 
            className={`fullscreen-btn ${isFullScreen ? 'active' : ''}`}
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit Full Screen (Esc or F)" : "Enter Full Screen (F or F11)"}
          >
            {isFullScreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="arrow-chart-scroll-container" 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp} 
        onWheel={handleWheel} 
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div className="arrow-chart-viewport">
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }}>
          </svg>
        </div>
      </div>
      <div className="arrow-chart-instructions">
        <p>
          Use mouse wheel + Ctrl to zoom • Click and drag to pan • Ctrl+0 to reset • Click on nodes to select them • 
          {isFullScreen ? ' Press Esc or F to exit full screen' : ' Press F or F11 for full screen'} • 
          Press M to toggle movement arrows
        </p>
      </div>
    </div>
  );
};

ArrowChart.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  pastDate: PropTypes.string.isRequired,
  rootUnit: PropTypes.string.isRequired,
  childUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  parallelUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  clickedNodeID: PropTypes.string,
  setClickedNodeID: PropTypes.func.isRequired,
  levels: PropTypes.number,
};

export default ArrowChart;