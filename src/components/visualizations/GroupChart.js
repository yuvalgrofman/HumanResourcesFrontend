import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import './GroupChart.css';
import { generateParentColors } from '../../utils/colors';
import { ColorUnitCard } from '../chart/node/ColorUnitCard';
import { rolesDifference } from '../../utils/helpers';

const GroupChart = ({ selectedDate, pastDate, rootUnit, childUnits, parallelUnits, clickedNodeID, setClickedNodeID, levels = 5, arrowFilterValue = 0 }) => {
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
        // Remove if already present
        return prevIds.filter(id => id !== nodeId);
      } else {
        // Add if not present
        let newIds = [...prevIds, nodeId];
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
          total_personnel: unit.total_personnel || 0,
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

  // Calculate soldier movements between time periods with hierarchical routing
  const calculateSoldierMovements = (currentUnits, pastUnits) => {
    let bottomRowLevelConst = levels - 1;
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
                parentId: unit.parent_id,
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
                parentId: unit.parent_id,
                roleType: roleType
              });
            });
          }
        });
      }
    });

    // Create unit hierarchy maps
    const unitHierarchy = new Map();
    const parentToChildren = new Map();
    
    currentUnits.forEach(unit => {
      unitHierarchy.set(unit.id, {
        id: unit.id,
        name: unit.name,
        parentId: unit.parent_id,
        level: 0 // Will be calculated below
      });
      
      if (unit.parent_id) {
        if (!parentToChildren.has(unit.parent_id)) {
          parentToChildren.set(unit.parent_id, []);
        }
        parentToChildren.get(unit.parent_id).push(unit.id);
      }
    });

    // Calculate unit levels (depth in hierarchy)
    const calculateLevel = (unitId, visited = new Set()) => {
      if (visited.has(unitId)) return 0; // Prevent infinite loops
      visited.add(unitId);
      
      const unit = unitHierarchy.get(unitId);
      if (!unit || !unit.parentId) return 0;
      
      const parentLevel = calculateLevel(unit.parentId, visited);
      unit.level = parentLevel + 1;
      return unit.level;
    };

    // Calculate levels for all units
    unitHierarchy.forEach((unit, unitId) => {
      if (unit.level === 0) {
        calculateLevel(unitId);
      }
    });

    const bottomRowLevel = bottomRowLevelConst;
    const parentRowLevel = bottomRowLevelConst - 1;

    // Get units at bottom row and parent row
    const bottomRowUnits = Array.from(unitHierarchy.values()).filter(unit => unit.level === bottomRowLevel);
    const parentRowUnits = Array.from(unitHierarchy.values()).filter(unit => unit.level === parentRowLevel);

    // Group direct movements by unit pairs for bottom row transfers
    const directMovements = new Map();

    // Find movements involving bottom row units
    currentSoldierToUnit.forEach((currentInfo, soldierId) => {
      const pastInfo = pastSoldierToUnit.get(soldierId);
      
      if (pastInfo && pastInfo.unitId !== currentInfo.unitId) {
        const sourceUnit = unitHierarchy.get(pastInfo.unitId);
        const destUnit = unitHierarchy.get(currentInfo.unitId);
        
        // Only process movements involving bottom row units
        if (sourceUnit && destUnit && 
          (sourceUnit.level === bottomRowLevel && destUnit.level === bottomRowLevel) &&
          pastInfo.parentId !== currentInfo.parentId ) {
          
          const key = `${pastInfo.unitId}->${currentInfo.unitId}`;
          if (!directMovements.has(key)) {
            directMovements.set(key, {
              fromUnit: pastInfo.unitId,
              fromUnitName: pastInfo.unitName,
              fromParentId: pastInfo.parentId,
              toUnit: currentInfo.unitId,
              toUnitName: currentInfo.unitName,
              toParentId: currentInfo.parentId,
              soldiers: [],
              movementType: 'transfer'
            });
          }
          directMovements.get(key).soldiers.push(soldierId);
        }
      }
    });

    // Process movements through hierarchical routing
    const processedMovements = new Map();

    directMovements.forEach(movement => {
      const sourceUnit = unitHierarchy.get(movement.fromUnit);
      const destUnit = unitHierarchy.get(movement.toUnit);
      
      if (!sourceUnit || !destUnit) return;

      // Case 1: Both units are in bottom row - route through parents
      if (sourceUnit.level === bottomRowLevel && destUnit.level === bottomRowLevel) {
        const sourceParentId = movement.fromParentId;
        const destParentId = movement.toParentId;
        
        if (sourceParentId && destParentId) {
          // Step 1: Bottom unit to its parent
          const step1Key = `${movement.fromUnit}->${sourceParentId}`;
          if (!processedMovements.has(step1Key)) {
            processedMovements.set(step1Key, {
              fromUnit: movement.fromUnit,
              fromUnitName: movement.fromUnitName,
              toUnit: sourceParentId,
              toUnitName: unitHierarchy.get(sourceParentId)?.name || 'Parent Unit',
              soldiers: [],
              movementType: 'up_to_parent',
              soldierCount: 0
            });
          }
          processedMovements.get(step1Key).soldiers.push(...movement.soldiers);
          processedMovements.get(step1Key).soldierCount = processedMovements.get(step1Key).soldiers.length;

          // Step 2: Parent to parent (if different parents)
          if (sourceParentId !== destParentId) {
            const step2Key = `${sourceParentId}->${destParentId}`;
            if (!processedMovements.has(step2Key)) {
              processedMovements.set(step2Key, {
                fromUnit: sourceParentId,
                fromUnitName: unitHierarchy.get(sourceParentId)?.name || 'Source Parent',
                toUnit: destParentId,
                toUnitName: unitHierarchy.get(destParentId)?.name || 'Dest Parent',
                soldiers: [],
                movementType: 'parent_to_parent',
                soldierCount: 0
              });
            }
            processedMovements.get(step2Key).soldiers.push(...movement.soldiers);
            processedMovements.get(step2Key).soldierCount = processedMovements.get(step2Key).soldiers.length;
          }

          // Step 3: Parent to destination bottom unit
          const step3Key = `${destParentId}->${movement.toUnit}`;
          if (!processedMovements.has(step3Key)) {
            processedMovements.set(step3Key, {
              fromUnit: destParentId,
              fromUnitName: unitHierarchy.get(destParentId)?.name || 'Parent Unit',
              toUnit: movement.toUnit,
              toUnitName: movement.toUnitName,
              soldiers: [],
              movementType: 'down_from_parent',
              soldierCount: 0
            });
          }
          processedMovements.get(step3Key).soldiers.push(...movement.soldiers);
          processedMovements.get(step3Key).soldierCount = processedMovements.get(step3Key).soldiers.length;
        }
      }
      // Case 2: Movement from bottom row to parent row
      else if (sourceUnit.level === bottomRowLevel && destUnit.level === parentRowLevel) {
        const movementKey = `${movement.fromUnit}->${movement.toUnit}`;
        if (!processedMovements.has(movementKey)) {
          processedMovements.set(movementKey, {
            fromUnit: movement.fromUnit,
            fromUnitName: movement.fromUnitName,
            toUnit: movement.toUnit,
            toUnitName: movement.toUnitName,
            soldiers: [],
            movementType: 'up_to_parent',
            soldierCount: 0
          });
        }
        processedMovements.get(movementKey).soldiers.push(...movement.soldiers);
        processedMovements.get(movementKey).soldierCount = processedMovements.get(movementKey).soldiers.length;
      }
      // Case 3: Movement from parent row to bottom row
      else if (sourceUnit.level === parentRowLevel && destUnit.level === bottomRowLevel) {
        const movementKey = `${movement.fromUnit}->${movement.toUnit}`;
        if (!processedMovements.has(movementKey)) {
          processedMovements.set(movementKey, {
            fromUnit: movement.fromUnit,
            fromUnitName: movement.fromUnitName,
            toUnit: movement.toUnit,
            toUnitName: movement.toUnitName,
            soldiers: [],
            movementType: 'down_from_parent',
            soldierCount: 0
          });
        }
        processedMovements.get(movementKey).soldiers.push(...movement.soldiers);
        processedMovements.get(movementKey).soldierCount = processedMovements.get(movementKey).soldiers.length;
      }
    });

    // Convert processed movements to final movements array
    processedMovements.forEach(movement => {
      movements.push({
        ...movement,
        soldierIds: movement.soldiers
      });
    });

    console.log('Soldier Movements:', movements);
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
  }, [flatCurrentUnits, flatPastUnits, levels]);

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

  // Get arrow styling based on soldier count
  const getArrowStyling = (soldierCount) => {
    // Color intensity and stroke width based on number of soldiers
    let strokeWidth, strokeColor, opacity;
    
    if (soldierCount <= 2) {
      strokeWidth = '5px';
      strokeColor = '#90A4AE'; // Light gray for small movements
      opacity = 0.7;
    } else if (soldierCount <= 4) {
      strokeWidth = '6px';
      strokeColor = '#5C6BC0'; // Medium blue
      opacity = 0.75;
    } else if (soldierCount <= 6) {
      strokeWidth = '7px';
      strokeColor = '#3F51B5'; // Darker blue
      opacity = 0.8;
    } else if (soldierCount <= 8) {
      strokeWidth = '8px';
      strokeColor = '#3F51B5'; // Darker blue
      opacity = 0.85;
    } else {
      strokeWidth = '9px';
      strokeColor = '#1A237E'; // Very dark blue for large movements
      opacity = 0.95;
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
    const levelHeight = 300;
    const lastLevelExtraGap = 200; // Extra vertical gap before the last level

    // Create tree layout
    const treeLayout = d3.tree()
      .nodeSize([nodeWidth + 40, levelHeight])
      .separation((a, b) => 1);

    // Create hierarchy
    const root = d3.hierarchy(buildTreeData);
    const treeData = treeLayout(root);

    // Calculate the maximum depth to identify the last level
    const maxDepth = treeData.height;

    // Apply custom positioning with extra gap for last level
    treeData.descendants().forEach(d => {
      if (d.depth === maxDepth) {
        // Add extra vertical spacing for the last level
        d.y += 3 * lastLevelExtraGap / 2;
      } else if (d.depth === maxDepth - 1) {
        // Add extra vertical spacing for the second last level
        d.y += lastLevelExtraGap / 2 - 40;
      }
    });

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

    // Calculate bounds after custom positioning (including the extra gap)
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    treeData.descendants().forEach(d => {
      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x);
      maxY = Math.max(maxY, d.y);
    });
    
    const treeWidth = maxX - minX + nodeWidth;
    const treeHeight = maxY + nodeHeight + 200; // Account for the extra gap
    
    // Set SVG dimensions
    svg.attr('width', Math.max(treeWidth + 200, containerWidth))
      .attr('height', Math.max(treeHeight + 200, containerHeight));

    // Define arrow markers
    const defs = svg.append('defs');
    
    // Transfer arrow marker (blue)
    defs.append('marker')
      .attr('id', 'group-transfer')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#2196F3');

    // Create main group for zoom/pan
    const g = svg.append('g')
      .attr('class', 'tree-container')
      .attr('transform', `translate(${treeWidth/2 + 100},100)`);

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
          
          // Calculate the midpoint for the connection, accounting for large gap
          const midY = source.y + nodeHeight/2 + 80 + 
            (target.depth === maxDepth ? lastLevelExtraGap/2 : 0);
          
          return `M${source.x},${source.y + nodeHeight/2 + 42}
                  L${source.x},${midY}
                  L${target.x},${midY}
                  L${target.x},${target.y + 42}`;
        })
        .style('fill', 'none')
        .style('stroke', '#37B7C3')
        .style('stroke-width', '2px');
    }

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
        const pastUnit = findUnitById(flatPastUnits, unitData.id);

        // Create ParallelUnitCard-style HTML with special soldiers info and ellipse background
        this.innerHTML = ColorUnitCard(
          unitData, 
          currentUnit, 
          pastUnit, 
          rootUnit, 
          parallelUnits, 
          clickedNodeIds
        );
      });



    // Define arrow markers for different types
    defs.append('marker')
      .attr('id', 'group-green')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#4CAF50');

    defs.append('marker')
      .attr('id', 'group-red')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f44336');

    // Get all bottom row units (level 2 units that have parents at level 1)
    let bottomRowLevelConst = levels - 1;
    const bottomRowLevel = bottomRowLevelConst;
    const parentRowLevel = bottomRowLevelConst - 1;
    
    const unitHierarchy = new Map();
    flatCurrentUnits.forEach(unit => {
      unitHierarchy.set(unit.id, {
        id: unit.id,
        name: unit.name,
        parentId: unit.parent_id,
        level: 0
      });
    });

    // Calculate unit levels
    const calculateLevel = (unitId, visited = new Set()) => {
      if (visited.has(unitId)) return 0;
      visited.add(unitId);
      
      const unit = unitHierarchy.get(unitId);
      if (!unit || !unit.parentId) return 0;
      
      const parentLevel = calculateLevel(unit.parentId, visited);
      unit.level = parentLevel + 1;
      return unit.level;
    };

    unitHierarchy.forEach((unit, unitId) => {
      if (unit.level === 0) {
        calculateLevel(unitId);
      }
    });

    const bottomRowUnits = Array.from(unitHierarchy.values()).filter(unit => unit.level === bottomRowLevel);
    const parentIds = Array.from(unitHierarchy.values()).filter(unit => unit.level === parentRowLevel);
    // Find all units with id in parentIds
    let parentRowUnits = flatCurrentUnits.filter(unit => parentIds.some(parent => parent.id === unit.id));
    let pastParentRowUnits = flatPastUnits.filter(unit => parentIds.some(parent => parent.id === unit.id));
    const parentColorMap = new Map();
    const parentColors = generateParentColors();
    parentRowUnits.forEach((unit, index) => {
      const colorIndex = index % parentColors.length;
      parentColorMap.set(unit.id, {
        start: parentColors[colorIndex * 2],
        end: parentColors[colorIndex * 2 + 1] || parentColors[colorIndex * 2]
      });
    });

    // Draw minicards for units in the parent row
    parentRowUnits.forEach(parentUnit => {
      if (!nodePositions.has(parentUnit.id)) return;
      const currentUnit = parentUnit;
      const pastUnit = findUnitById(pastParentRowUnits, parentUnit.id);

      const parentPos = nodePositions.get(parentUnit.id);
      const boxX = parentPos.x - 75; // Center the box (150px width / 2)
      const boxY = parentPos.y + 330; // 135 pixels below the node
      const parentColor = parentColorMap.get(parentUnit.id) || { start: '#667eea', end: '#764ba2' };
      
      const boxGroup = g.append('g').attr('class', 'parent-minicard-box');
      
      // Add rounded rectangle
      boxGroup.append('rect')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', 150)
        .attr('height', 60)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', '#f8f9fa')
        .attr('stroke', '#e9ecef')
        .attr('stroke-width', '1px');
      

      // Add MiniCard content
      boxGroup.append('foreignObject')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', 150)
        .attr('height', 60)
        .append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('font-size', '12px')
        .style('color', '#ffffff')
        .style('background', `linear-gradient(135deg, ${parentColor.start} 0%, ${parentColor.end} 100%)`)
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
        .html(`<div style="text-align: center; padding: 4px;">
          <div style="font-weight: bold; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">${parentUnit.name}</div>
        </div>`);

      if (!currentUnit || !pastUnit) return;

      // compute width
      const changedRoles = rolesDifference(pastUnit.roles, currentUnit.roles);
      const newRolesCount = changedRoles.totals.totalNewRoles;
      const removedRolesCount = changedRoles.totals.totalRemovedRoles;

      const greenWidth = Math.max(5, Math.min(60, newRolesCount * 5));
      const redWidth = Math.max(5, Math.min(60, removedRolesCount * 5));
      const greyWidth = 120 - greenWidth - redWidth;
      
      const greenColor = "#8bc34a"; // Green for new roles
      const redColor = "#e57373"; // Red for removed roles
      const greyColor = "#90A4AE"; // Gray for unchanged roles
      const lineOpacity = 0.8;
      
      // Draw connection line from parent node to minicard
      const connectionStartY = parentPos.y + 135; // Bottom of parent node
      const connectionEndY = boxY + 1; // Top of minicard
      const connectionStartX = boxX + 30; // Center of parent node
      
      boxGroup.append('line')
        .attr('x1', connectionStartX)
        .attr('y1', connectionStartY)
        .attr('x2', connectionStartX)
        .attr('y2', connectionEndY)
        .attr('stroke', greenColor)
        .attr('stroke-width', greenWidth)
        .attr('opacity', lineOpacity)
      boxGroup.append('line')
        .attr('x1', connectionStartX + greenWidth / 2 + greyWidth / 2)
        .attr('y1', connectionStartY)
        .attr('x2', connectionStartX + greenWidth / 2 + greyWidth / 2)
        .attr('y2', connectionEndY)
        .attr('stroke', greyColor)
        .attr('stroke-width', greyWidth)
        .attr('opacity', lineOpacity)
      boxGroup.append('line')
        .attr('x1', connectionStartX + greenWidth / 2 + greyWidth + redWidth / 2)
        .attr('y1', connectionStartY)
        .attr('x2', connectionStartX + greenWidth / 2 + greyWidth + redWidth / 2)
        .attr('y2', connectionEndY)
        .attr('stroke', redColor)
        .attr('stroke-width', redWidth)
        .attr('opacity', lineOpacity)
    });

    // 1. Draw bidirectional arrows between bottom row units and their parents
    bottomRowUnits.forEach(childUnit => {
      if (!childUnit.parentId || !nodePositions.has(childUnit.id) || !nodePositions.has(childUnit.parentId)) {
        return;
      }

      const childPos = nodePositions.get(childUnit.id);
      const parentPos = nodePositions.get(childUnit.parentId);
      
      // Calculate soldier movements for this child-parent pair
      let soldiersToChild = 0;
      let soldiersToParent = 0;
      
      soldierMovements.forEach(movement => {
        if (movement.toUnit === childUnit.id && movement.fromUnit === childUnit.parentId) {
          soldiersToChild += movement.soldierCount;
        }
        if (movement.fromUnit === childUnit.id && movement.toUnit === childUnit.parentId) {
          soldiersToParent += movement.soldierCount;
        }
      });

      // Only draw arrows if there are soldiers to show and above filter threshold
      if (soldiersToChild <= arrowFilterValue && soldiersToParent <= arrowFilterValue) {
        return;
      }

      // Check clicked arrows filter
      if (showClickedArrows && !clickedNodeIds.includes(childUnit.id) && !clickedNodeIds.includes(childUnit.parentId)) {
        return;
      }

      const arrowGap = 18; // Gap between the two arrows
      
      // Calculate base positions
      const childCenterX = childPos.x;
      const childTopY = childPos.y - 20;
      const parentCenterX = parentPos.x;
      const parentBottomY = parentPos.y + nodeHeight;
      
      // Calculate horizontal offset based on child position relative to parent
      const horizontalOffset = (childCenterX - parentCenterX) * 0.15; // Scale down the offset
      const parentArrowX = parentCenterX;

      // GREEN ARROW: Parent to Child (downward)
      if (soldiersToChild > arrowFilterValue) {
        const greenArrowGroup = g.append('g').attr('class', 'bidirectional-arrow-group');
        
        const greenStartX = parentArrowX + horizontalOffset + arrowGap;
        const greenStartY = parentBottomY + 195;
        const greenEndX = childCenterX + arrowGap;
        const greenEndY = childTopY + 15;
        
        const greenControlY = (greenStartY + greenEndY) / 2 + 30;
        // const greenPathData = `M${greenStartX},${greenStartY} L${greenStartX},${greenControlY} L${greenEndX},${greenControlY} L${greenEndX},${greenEndY}`;
        const greenPathData = `M${greenStartX},${greenStartY} L${greenEndX},${greenEndY}`
        
        greenArrowGroup.append('path')
          .attr('d', greenPathData)
          .attr('fill', 'none')
          .attr('stroke', '#4CAF50')
          .attr('stroke-width', '3px')
          .attr('marker-end', 'url(#group-green)')
          .attr('opacity', 0.8)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this).attr('stroke-width', '5px').attr('opacity', 1);
            
            const tooltip = d3.select('body').append('div')
              .attr('class', 'group-tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0, 0, 0, 0.9)')
              .style('color', 'white')
              .style('padding', '8px 12px')
              .style('border-radius', '6px')
              .style('font-size', '14px')
              .style('pointer-events', 'none')
              .style('z-index', '1000')
              .style('opacity', '0')
              .html(`
                <div style="margin-bottom: 6px; font-weight: bold; color: #4CAF50;">
                  INCOMING PERSONNEL
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>From:</strong> ${unitHierarchy.get(childUnit.parentId)?.name || 'Parent Unit'}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>To:</strong> ${childUnit.name}
                </div>
                <div>
                  <strong>Personnel:</strong> ${soldiersToChild} soldier${soldiersToChild !== 1 ? 's' : ''}
                </div>
              `);
            
            tooltip.transition().duration(200).style('opacity', '1');
            tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseleave', function() {
            d3.select(this).attr('stroke-width', '3px').attr('opacity', 0.8);
            d3.selectAll('.group-tooltip').remove();
          });
      }

      // RED ARROW: Child to Parent (upward)
      if (soldiersToParent > arrowFilterValue) {
        const redArrowGroup = g.append('g').attr('class', 'bidirectional-arrow-group');
        
        const redEndX = parentArrowX + horizontalOffset - arrowGap;
        const redEndY = parentBottomY + 195;
        const redStartX = childCenterX - arrowGap;
        const redStartY = childTopY + 15;
        
        const redControlY = (redStartY + redEndY) / 2 + 30;
        const redPathData = `M${redStartX},${redStartY} L${redEndX},${redEndY}`
        
        redArrowGroup.append('path')
          .attr('d', redPathData)
          .attr('fill', 'none')
          .attr('stroke', '#f44336')
          .attr('stroke-width', '3px')
          .attr('marker-end', 'url(#group-red)')
          .attr('opacity', 0.8)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this).attr('stroke-width', '5px').attr('opacity', 1);
            
            const tooltip = d3.select('body').append('div')
              .attr('class', 'group-tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0, 0, 0, 0.9)')
              .style('color', 'white')
              .style('padding', '8px 12px')
              .style('border-radius', '6px')
              .style('font-size', '14px')
              .style('pointer-events', 'none')
              .style('z-index', '1000')
              .style('opacity', '0')
              .html(`
                <div style="margin-bottom: 6px; font-weight: bold; color: #f44336;">
                  OUTGOING PERSONNEL
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>From:</strong> ${childUnit.name}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>To:</strong> ${unitHierarchy.get(childUnit.parentId)?.name || 'Parent Unit'}
                </div>
                <div>
                  <strong>Personnel:</strong> ${soldiersToParent} soldier${soldiersToParent !== 1 ? 's' : ''}
                </div>
              `);
            
            tooltip.transition().duration(200).style('opacity', '1');
            tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseleave', function() {
            d3.select(this).attr('stroke-width', '3px').attr('opacity', 0.8);
            d3.selectAll('.group-tooltip').remove();
          });
      }
    });

    // 2. Draw parent-to-parent arrows (existing logic but modified)
    if (soldierMovements.length > 0) {
      const parentToParentMovements = soldierMovements.filter(movement => {
        const sourceUnit = unitHierarchy.get(movement.fromUnit);
        const destUnit = unitHierarchy.get(movement.toUnit);
        
        return sourceUnit && destUnit && 
               sourceUnit.level === parentRowLevel && 
               destUnit.level === parentRowLevel &&
               movement.soldierCount > arrowFilterValue &&
               nodePositions.has(movement.fromUnit) &&
               nodePositions.has(movement.toUnit);
      });

      const movementArrows = g.selectAll('.parent-movement-group')
        .data(parentToParentMovements.filter(movement => {
          // Apply clicked arrows filter
          if (showClickedArrows) {
            return clickedNodeIds.includes(movement.fromUnit) || 
                   clickedNodeIds.includes(movement.toUnit);
          }
          return true;
        }))
        .enter()
        .append('g')
        .attr('class', 'parent-movement-group');

      movementArrows.each(function(d) {
        const fromPos = nodePositions.get(d.fromUnit);
        const toPos = nodePositions.get(d.toUnit);
        
        if (!fromPos || !toPos) return;

        const arrowStyle = getArrowStyling(d.soldierCount);
        
        const fromCenterX = fromPos.x;
        const fromCenterY = fromPos.y + fromPos.height / 2;
        const toCenterX = toPos.x;
        const toCenterY = toPos.y + toPos.height / 2;

        let startX, startY, endX, endY;
        const isTargetRight = toCenterX > fromCenterX;

        if (isTargetRight) {
          startX = fromCenterX;
          startY = fromPos.y - 22;
          endX = toCenterX;
          endY = toPos.y - 5;
        } else {
          startX = fromCenterX;
          startY = fromPos.y + 152;
          endX = toCenterX;
          endY = toPos.y + 138;
        }

        const horizontalDistance = Math.abs(endX - startX);
        const baseArcHeight = horizontalDistance * 0.015;
        const maxArcHeight = 180;
        let arcHeight = Math.max(Math.min(baseArcHeight, maxArcHeight), 20);
        let aboveFlag = isTargetRight ? -1 : 1;
        const controlY = Math.min(startY, endY) + aboveFlag * arcHeight;
        
        const pathData = `M${startX},${startY} L${startX},${controlY} L${endX},${controlY} L${endX},${endY}`;

        const dotAdjustment = isTargetRight ? 6 : -6;
        const parentColor = parentColorMap.get(d.toUnit) || { start: '#667eea', end: '#764ba2' };

        // Add grey dot at start
        d3.select(this)
          .append('circle')
          .attr('cx', startX)
          .attr('cy', startY + dotAdjustment)
          .attr('r', 7)
          .attr('fill', '#808080')

        const arrowPath = d3.select(this)
          .append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', parentColor.start)
          .attr('stroke-width', arrowStyle.strokeWidth)
          .attr('marker-end', 'url(#group-transfer)')
          .attr('opacity', arrowStyle.opacity)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this)
              .attr('stroke-width', parseFloat(arrowStyle.strokeWidth) + 2)
              .attr('opacity', Math.min(arrowStyle.opacity + 0.3, 1));
            
            const tooltip = d3.select('body').append('div')
              .attr('class', 'group-tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0, 0, 0, 0.9)')
              .style('color', 'white')
              .style('padding', '8px 12px')
              .style('border-radius', '6px')
              .style('font-size', '14px')
              .style('pointer-events', 'none')
              .style('z-index', '1000')
              .style('opacity', '0')
              .html(`
                <div style="margin-bottom: 6px; font-weight: bold; color: #64B5F6;">
                  PARENT-TO-PARENT TRANSFER
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>From:</strong> ${d.fromUnitName || 'Unknown'}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>To:</strong> ${d.toUnitName || 'Unknown'}
                </div>
                <div>
                  <strong>Personnel:</strong> ${d.soldierCount} soldier${d.soldierCount !== 1 ? 's' : ''}
                </div>
              `);
            
            tooltip.transition().duration(200).style('opacity', '1');
            tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseleave', function() {
            d3.select(this)
              .attr('stroke-width', arrowStyle.strokeWidth)
              .attr('opacity', arrowStyle.opacity);
            d3.selectAll('.group-tooltip').remove();
          });
      });
    }

    // Apply zoom and pan transforms
    g.attr('transform', 
      `translate(${treeWidth/2 + 100 + panOffset.x / zoomLevel},${100 + panOffset.y / zoomLevel}) scale(${zoomLevel})`
    );

    }, [buildTreeData, flatPastUnits, rootUnit, parallelUnits, zoomLevel, panOffset, clickedNodeID, soldierMovements, showStructure, arrowFilterValue, levels, clickedNodeIds, showClickedArrows]);

  if (!buildTreeData) {
    return (
      <div className={`group-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
        <div className="group-chart-message">
          <p>Please select a root unit to display the organizational chart.</p>
        </div>
      </div>
    );
  }

  const totalNodes = flatCurrentUnits.length;
  const maxDepth = buildTreeData ? d3.hierarchy(buildTreeData).height + 1 : 0;
  const displayedDepth = Math.min(maxDepth, levels);
  
  return (
    <div className={`group-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
      <div className="group-chart-header">
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
              {showClickedArrows ?  '🌐 Show All' : '🎯 Show Clicked (Cooli)'}
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
        className="group-chart-scroll-container" 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp} 
        onWheel={handleWheel} 
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div className="group-chart-viewport">
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }}>
          </svg>
        </div>
      </div>
      <div className="group-chart-instructions">
        <p>
          Use mouse wheel + Ctrl to zoom • Click and drag to pan • Ctrl+0 to reset • Click on nodes to select them • 
          {isFullScreen ? ' Press Esc or F to exit full screen' : ' Press F or F11 for full screen'} • 
          Press M to toggle movement arrows
        </p>
      </div>
    </div>
  );
};

GroupChart.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  pastDate: PropTypes.string.isRequired,
  rootUnit: PropTypes.string.isRequired,
  childUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  parallelUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  clickedNodeID: PropTypes.string,
  setClickedNodeID: PropTypes.func.isRequired,
  levels: PropTypes.number,
};

export default GroupChart;