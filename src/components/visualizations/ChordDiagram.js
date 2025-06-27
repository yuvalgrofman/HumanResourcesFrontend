import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import './ChordDiagram.css';
import { generateParentColors, generateFamilyColors } from '../../utils/colors';
import { normalizeMatrix } from '../../utils/helpers';

const ChordDiagram = ({ selectedDate, pastDate, rootUnit, childUnits, parallelUnits, clickedNodeID, setClickedNodeID}) => {
  const { currentUnits, pastUnits } = useData();
  const [flatCurrentUnits, setFlatCurrentUnits] = useState([]);
  const [flatPastUnits, setFlatPastUnits] = useState([]);
  const [soldierMovements, setSoldierMovements] = useState([]);
  const [levels, setLevels] = useState(3);
  const [isGrouped, setIsGrouped] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const svgRef = useRef();
  const containerRef = useRef();

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

  // Get units at the bottom level of the hierarchy
  const getBottomRowUnits = (units, rootUnitId) => {
    if (!units || units.length === 0) return [];

    // Build parent-child relationships
    const parentToChildren = new Map();
    const allUnitsById = new Map();
    
    units.forEach(unit => {
      allUnitsById.set(unit.id, unit);
      if (unit.parent_id) {
        if (!parentToChildren.has(unit.parent_id)) {
          parentToChildren.set(unit.parent_id, []);
        }
        parentToChildren.get(unit.parent_id).push(unit);
      }
    });

    // Find the deepest level units starting from root
    const findBottomUnits = (unitId, currentLevel = 0) => {
      const children = parentToChildren.get(unitId) || [];
      
      // If we've reached the specified levels depth or no children, this is bottom level
      if (currentLevel >= levels - 1) {
        const unit = allUnitsById.get(unitId);
        return unit ? [unit] : [];
      }
      
      // Otherwise, recursively get bottom units from children
      const bottomUnits = [];
      children.forEach(child => {
        bottomUnits.push(...findBottomUnits(child.id, currentLevel + 1));
      });
      
      return bottomUnits;
    };

    return findBottomUnits(rootUnitId);
  };

  // Get bottom row units for both time periods
  const bottomCurrentUnits = useMemo(() => 
    getBottomRowUnits(flatCurrentUnits, rootUnit), 
    [flatCurrentUnits, rootUnit, levels]
  );
  
  const bottomPastUnits = useMemo(() => 
    getBottomRowUnits(flatPastUnits, rootUnit), 
    [flatPastUnits, rootUnit, levels]
  );

  const unitNameToId = new Map();
  bottomCurrentUnits.forEach(unit => {
    unitNameToId.set(unit.name, unit.id);
  });

  bottomPastUnits.forEach(unit => {
    unitNameToId.set(unit.name, unit.id);
  });

  // Filter movements to only include bottom-level units
  const bottomLevelMovements = useMemo(() => {
    if (!soldierMovements || bottomCurrentUnits.length === 0) return [];
      
      const bottomUnitIds = new Set([
        ...bottomCurrentUnits.map(u => u.id),
        ...bottomPastUnits.map(u => u.id)
      ]);

      const restSeperated =  soldierMovements.filter(movement => {
      // Include movements where both source and target are bottom-level units
      // Or movements involving recruitment/departure from bottom-level units
      return (movement.fromUnit && bottomUnitIds.has(movement.fromUnit)) ||
             (movement.toUnit && bottomUnitIds.has(movement.toUnit));
      });
      
      const restGrouped = [];
      
      soldierMovements.forEach(movement => {
        const fromIsBottom = movement.fromUnit && bottomUnitIds.has(movement.fromUnit);
        const toIsBottom = movement.toUnit && bottomUnitIds.has(movement.toUnit);
        
        if (fromIsBottom && toIsBottom) {
          // Both units are at bottom level - keep as is
          restGrouped.push(movement);
        } else if (toIsBottom) {
          if (movement.fromUnitName !== "New Recruit") {
            // From non-bottom level to bottom level
            restGrouped.push({
              ...movement,
              fromUnit: 'rest-organization',
              fromUnitName: 'Rest Organization',
              movementType: 'from-rest'
            });
          } else {
            // restGrouped.push(movement);
          } 
        } else if (fromIsBottom) {
          if (movement.toUnitName !== "Left Organization") {
            // From bottom level to non-bottom level
            restGrouped.push({
              ...movement,
              toUnit: 'rest-organization',
              toUnitName: 'Rest Organization',
              movementType: 'to-rest'
            });
          } else {
            // From bottom level to departure
            // restGrouped.push(movement);
          }
        }
      });

    return isGrouped ? restGrouped : restSeperated;
  }, [soldierMovements, bottomCurrentUnits, bottomPastUnits, isGrouped]);

  // Filter recruitments to bottom-level units
  const bottomLevelRecruits = useMemo(() => {
    if (!soldierMovements || bottomCurrentUnits.length === 0) return [];
    
    const bottomUnitIds = new Set([
      ...bottomCurrentUnits.map(u => u.id),
      ...bottomPastUnits.map(u => u.id)
    ]);

    const recruits = soldierMovements.filter(movement => {
      return movement.movementType === 'recruitment' && 
             movement.toUnit && 
             bottomUnitIds.has(movement.toUnit);
    });
    console.log("bottomLevelRecruits", recruits);
    return recruits;
  }, [soldierMovements, bottomCurrentUnits, bottomPastUnits]);

  // Filter retirements from bottom-level units
  const bottomLevelRestRetirements = useMemo(() => {
    if (!soldierMovements || bottomCurrentUnits.length === 0) return [];
    
    const bottomUnitIds = new Set([
      ...bottomCurrentUnits.map(u => u.id),
      ...bottomPastUnits.map(u => u.id)
    ]);

    const retirees = soldierMovements.filter(movement => {
      return movement.movementType === 'departure' && 
             movement.fromUnit && 
             bottomUnitIds.has(movement.fromUnit);
    });
    console.log("bottomLevelRestRetirements", retirees);
    return retirees;
  }, [soldierMovements, bottomCurrentUnits, bottomPastUnits]);

  // Calculate movement statistics
  const movementStats = useMemo(() => {
    if (!bottomLevelMovements) return { totalMovements: 0, transferSoldiers: 0, recruitmentSoldiers: 0, departureSoldiers: 0 };
    
    let transferSoldiers = 0;
    let recruitmentSoldiers = 0;
    let departureSoldiers = 0;
    
    bottomLevelMovements.forEach(movement => {
      if (movement.movementType === 'transfer') {
        transferSoldiers += movement.soldierCount;
      } else if (movement.movementType === 'recruitment') {
        recruitmentSoldiers += movement.soldierCount;
      } else if (movement.movementType === 'departure') {
        departureSoldiers += movement.soldierCount;
      }
    });
    
    return {
      totalMovements: bottomLevelMovements.length,
      totalSoldiers: transferSoldiers + recruitmentSoldiers + departureSoldiers,
      transferSoldiers,
      recruitmentSoldiers,
      departureSoldiers
    };
  }, [bottomLevelMovements]);

  // Create D3 chord diagram
  useEffect(() => {
    if (!svgRef.current || bottomLevelMovements.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Get unique unit names for the chord diagram
    const uniqueUnitNames = Array.from(new Set([
      ...bottomLevelMovements.map(m => m.fromUnitName).filter(Boolean),
      ...bottomLevelMovements.map(m => m.toUnitName).filter(Boolean)
    ]));

    // Create a map to group units by their parents
    const unitsByParent = new Map();
    const unitsWithoutParent = [];

    uniqueUnitNames.forEach(unitName => {
      // Find the unit in bottom units to get its parent
      const currentUnit = bottomCurrentUnits.find(u => u.name === unitName);
      const pastUnit = bottomPastUnits.find(u => u.name === unitName);
      const unit = currentUnit || pastUnit;
      
      if (unit && unit.parent_id) {
        // Find parent unit to get parent name
        const parentUnit = [...flatCurrentUnits, ...flatPastUnits].find(u => u.id === unit.parent_id);
        const parentName = parentUnit ? parentUnit.name : `Parent_${unit.parent_id}`;
        
        if (!unitsByParent.has(parentName)) {
          unitsByParent.set(parentName, []);
        }
        unitsByParent.get(parentName).push(unitName);
      } else {
        // Units without parent (like "New Recruit", "Left Organization", "Rest Organization")
        unitsWithoutParent.push(unitName);
      }
    });

    // Sort parent groups and their children, then flatten
    const sortedParentNames = Array.from(unitsByParent.keys()).sort();
    const unitNames = [];

    // Add units grouped by parent
    sortedParentNames.forEach(parentName => {
      const parentUnits = unitsByParent.get(parentName).sort();
      unitNames.push(...parentUnits);
    });

    // Add units without parent at the end
    unitNames.push(...unitsWithoutParent.sort());

    if (unitNames.length === 0) return;

    // Create matrix for chord diagram
    const nameToIndex = new Map(unitNames.map((name, i) => [name, i]));
    const matrix = Array(unitNames.length).fill(null).map(() => Array(unitNames.length).fill(0));

    // Fill matrix with movement data
    bottomLevelMovements.forEach(movement => {
      const fromIndex = nameToIndex.get(movement.fromUnitName);
      const toIndex = nameToIndex.get(movement.toUnitName);
      
      if (fromIndex !== undefined && toIndex !== undefined) {
        matrix[fromIndex][toIndex] += movement.soldierCount;
      }
    });

    // Set up dimensions
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 800;
    const width = isFullScreen ? Math.min(window.innerWidth * 0.9, 1000) : Math.min(containerWidth, 1400);
    const height = isFullScreen ? Math.min(window.innerHeight * 0.9, 800) : Math.min(containerHeight, 800);
    const radius = Math.min(width, height) * 0.45;
    const innerRadius = radius - 30;
    const outerRadius = radius - 10;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .style("font", "12px sans-serif");

    // Create chord layout
    const chord = d3.chordDirected()
      .padAngle(0.005)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    const originalMatrix = matrix;
    const normalizedMatrix = normalizeMatrix(matrix, 0.4, 1.0);
    const chords = chord(normalizedMatrix);

    // Create arcs and ribbons
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbonArrow()
      .radius(innerRadius - 2)
      .padAngle(0.005);

    // Get family colors and assign colors based on parent-child relationships
    const familyColors = generateFamilyColors();
    const unitColorPairs = new Map();
    
    // Create a map of parent names to their family color index
    const parentToColorIndex = new Map();
    let familyColorIndex = 0;
    
    // First pass: assign color indices to parents
    sortedParentNames.forEach(parentName => {
      if (familyColorIndex < familyColors.length) {
        parentToColorIndex.set(parentName, familyColorIndex);
        familyColorIndex++;
      } else {
        // Wrap around if we have more parents than color families
        parentToColorIndex.set(parentName, familyColorIndex % familyColors.length);
        familyColorIndex++;
      }
    });
    
    // Second pass: assign colors to units based on their parent
    unitNames.forEach((unitName, index) => {
      // Find which parent this unit belongs to
      let parentName = null;
      let childIndex = 0;
      
      for (const [parent, children] of unitsByParent.entries()) {
        const childIdx = children.indexOf(unitName);
        if (childIdx !== -1) {
          parentName = parent;
          childIndex = childIdx + 1; // +1 because index 0 is reserved for parent color
          break;
        }
      }
      
      if (parentName && parentToColorIndex.has(parentName)) {
        // Unit belongs to a parent - use family colors
        const colorFamilyIndex = parentToColorIndex.get(parentName);
        const colorFamily = familyColors[colorFamilyIndex];
        
        // Use child color if available, otherwise use parent color
        const colorIndex = Math.min(childIndex, colorFamily.length - 1);
        const unitColor = colorFamily[colorIndex];
        
        unitColorPairs.set(unitName, { 
          color1: unitColor, 
          color2: d3.color(unitColor).darker(0.3).toString() 
        });
      } else {
        // Unit without parent (like "New Recruit", "Left Organization", "Rest Organization")
        // Use a neutral color scheme or cycle through available colors
        const neutralColorIndex = index % familyColors.length;
        const neutralColor = familyColors[neutralColorIndex][0]; // Use parent color from available families
        
        unitColorPairs.set(unitName, { 
          color1: neutralColor, 
          color2: d3.color(neutralColor).darker(0.5).toString() 
        });
      }
    });

    // Create gradients for each unit
    const defs = svg.append("defs");
    
    unitNames.forEach((unitName, index) => {
      const colors = unitColorPairs.get(unitName);
      
      // Radial gradient for arcs
      const radialGradient = defs.append("radialGradient")
        .attr("id", `radial-gradient-${index}`)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
      
      radialGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colors.color1);
      
      radialGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colors.color2);
      
      // Linear gradient for ribbons
      const linearGradient = defs.append("linearGradient")
        .attr("id", `linear-gradient-${index}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colors.color1)
        .attr("stop-opacity", 0.8);
      
      linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colors.color2)
        .attr("stop-opacity", 0.6);
    });

    // Create main group with zoom and pan transforms
    const mainGroup = svg.append("g")
      .attr("transform", `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`);

    // Add ribbons (the connections between units) - Use normal blend mode for consistency
    mainGroup.append("g")
      .attr("fill-opacity", 0.7)
      .selectAll("path")
      .data(chords)
      .join("path")
      .attr("d", ribbon)
      .attr("fill", d => `url(#linear-gradient-${d.target.index})`)
      .attr("stroke", d => {
        const colors = unitColorPairs.get(unitNames[d.target.index]);
        return d3.color(colors.color2).darker();
      })
      .attr("stroke-width", 0.8)
      .style("mix-blend-mode", "normal")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity", 1);
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "chord-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000");
        
        tooltip.html(`
          <strong>${unitNames[d.source.index]}</strong> → <strong>${unitNames[d.target.index]}</strong><br/>
          Soldiers moved: ${originalMatrix[d.source.index][d.target.index]}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("fill-opacity", 0.7);
        d3.selectAll(".chord-tooltip").remove();
      });

    // Create parent arc data for outer ring
    const parentArcs = [];
    const processedParents = new Set();
    
    chords.groups.forEach(group => {
      const unitName = unitNames[group.index];
      
      // Find parent for this unit
      for (const [parentName, children] of unitsByParent.entries()) {
        if (children.includes(unitName) && !processedParents.has(parentName)) {
          // Calculate combined angle range for all children of this parent
          const childIndices = children.map(childName => nameToIndex.get(childName)).filter(idx => idx !== undefined);
          const childGroups = chords.groups.filter(g => childIndices.includes(g.index));
          
          if (childGroups.length > 0) {
            const minStartAngle = Math.min(...childGroups.map(g => g.startAngle));
            const maxEndAngle = Math.max(...childGroups.map(g => g.endAngle));
            
            parentArcs.push({
              parentName,
              startAngle: minStartAngle,
              endAngle: maxEndAngle,
              children: children
            });
            
            processedParents.add(parentName);
          }
        }
      }
    });

    // Add outer arcs for units without parents (like "Rest Organization", "New Recruit", "Left Organization")
    chords.groups.forEach(group => {
      const unitName = unitNames[group.index];
      
      // Check if this unit doesn't belong to any parent and isn't already processed
      let belongsToParent = false;
      for (const [parentName, children] of unitsByParent.entries()) {
        if (children.includes(unitName)) {
          belongsToParent = true;
          break;
        }
      }
      
      if (!belongsToParent) {
        parentArcs.push({
          parentName: unitName, // Use the unit name as its own parent
          startAngle: group.startAngle,
          endAngle: group.endAngle,
          children: [unitName], // Single child (itself)
          isStandalone: true // Flag to identify standalone units
        });
      }
    });

    // Calculate soldier counts for each parent to determine arc width
    const parentSoldierCounts = new Map();
    let maxParentSoldiers = 0;
    
    parentArcs.forEach(parentData => {
      let totalSoldiers = 0;
      
      if (parentData.isStandalone) {
        // For standalone units, get soldier count directly
        const unit = bottomCurrentUnits.find(u => u.name === parentData.parentName) ||
                     bottomPastUnits.find(u => u.name === parentData.parentName);
        totalSoldiers = unit ? unit.total_personnel : 0;
      } else {
        // For regular parent units, sum up all child soldiers
        parentData.children.forEach(childName => {
          const currentUnit = bottomCurrentUnits.find(u => u.name === childName);
          const pastUnit = bottomPastUnits.find(u => u.name === childName);
          const unit = currentUnit || pastUnit;
          if (unit) {
            totalSoldiers += unit.total_personnel || 0;
          }
        });
      }
      
      parentSoldierCounts.set(parentData.parentName, totalSoldiers);
      maxParentSoldiers = Math.max(maxParentSoldiers, totalSoldiers);
    });
    
    // Define outer arc dimensions with variable width
    const parentInnerRadius = outerRadius + 85;
    const minParentArcWidth = 8;  // Minimum arc width
    const maxParentArcWidth = 35; // Maximum arc width
    
    // Function to calculate arc width based on soldier count
    const getParentArcWidth = (soldierCount) => {
      if (maxParentSoldiers === 0) return minParentArcWidth;
      const ratio = soldierCount / maxParentSoldiers;
      return minParentArcWidth + (ratio * (maxParentArcWidth - minParentArcWidth));
    };
    
    const parentArc = d3.arc()
      .innerRadius(parentInnerRadius)
      .outerRadius(d => {
        const soldierCount = parentSoldierCounts.get(d.parentName) || 0;
        return parentInnerRadius + getParentArcWidth(soldierCount);
      });

    // Create gradients for parent units
    parentArcs.forEach((parentData, index) => {
      let parentColor;

      if (parentData.isStandalone) {
        // For standalone units, use the same color as the unit itself
        const colors = unitColorPairs.get(parentData.parentName);
        parentColor = colors ? colors.color1 : '#888888';
      } else {
        // For regular parent units, use family colors
        const colorFamilyIndex = parentToColorIndex.get(parentData.parentName) || 0;
        parentColor = familyColors[colorFamilyIndex][0]; // First color in the family
      }
      
      const parentGradient = defs.append("radialGradient")
        .attr("id", `parent-gradient-${index}`)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
      
      parentGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", parentColor);
      
      parentGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(parentColor).darker(0.5));
    });

    // Add parent arcs (outer ring)
    const parentGroup = mainGroup.append("g")
      .selectAll("g")
      .data(parentArcs)
      .join("g");
    
    // Add parent arcs with tooltips and click handlers
    parentGroup.append("path")
      .attr("d", parentArc)
      .attr("fill", (d, i) => `url(#parent-gradient-${i})`)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        // For parent units, we need to find a representative child unit ID
        // or use the parent unit name to find its ID
        if (d.isStandalone) {
          // For standalone units, use the unit name directly
          const unitId = unitNameToId.get(d.parentName);
          if (unitId && setClickedNodeID) {
            setClickedNodeID(unitId);
          }
        } else {
          // For regular parent units, find the parent unit in the data
          const parentUnit = [...flatCurrentUnits, ...flatPastUnits].find(unit => 
            unit.name === d.parentName
          );
          if (parentUnit && setClickedNodeID) {
            setClickedNodeID(parentUnit.id);
          }
        }
      })
      .on("mouseover", function(event, d) {
        // Highlight the parent arc
        d3.select(this).attr("stroke-width", 3);
        
        // Calculate soldier counts and movements for this parent
        let totalSoldiers = 0;
        let totalMovements = 0;
        let childrenInfo = [];
        
        if (d.isStandalone) {
          // For standalone units
          const unit = bottomCurrentUnits.find(u => u.name === d.parentName) ||
                       bottomPastUnits.find(u => u.name === d.parentName);
          totalSoldiers = unit ? unit.total_personnel : 0;
          
          // Count movements for this unit
          totalMovements = bottomLevelMovements.filter(movement => 
            movement.fromUnitName === d.parentName || movement.toUnitName === d.parentName
          ).length;
          
          childrenInfo.push({
            name: d.parentName,
            soldiers: totalSoldiers
          });
        } else {
          // For regular parent units, aggregate child data
          d.children.forEach(childName => {
            const currentUnit = bottomCurrentUnits.find(u => u.name === childName);
            const pastUnit = bottomPastUnits.find(u => u.name === childName);
            const unit = currentUnit || pastUnit;
            
            if (unit) {
              const childSoldiers = unit.total_personnel || 0;
              totalSoldiers += childSoldiers;
              childrenInfo.push({
                name: childName,
                soldiers: childSoldiers
              });
            }
            
            // Count movements for this child
            const childMovements = bottomLevelMovements.filter(movement => 
              movement.fromUnitName === childName || movement.toUnitName === childName
            ).length;
            totalMovements += childMovements;
          });
        }
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "parent-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.9)")
          .style("color", "white")
          .style("padding", "12px")
          .style("border-radius", "8px")
          .style("font-size", "13px")
          .style("pointer-events", "none")
          .style("z-index", "1002")
          .style("box-shadow", "0 4px 12px rgba(0,0,0,0.4)")
          .style("max-width", "300px");
        
        // Build tooltip content
        let tooltipContent = `
          <div style="color: #ffd700; font-weight: bold; font-size: 15px; margin-bottom: 8px; border-bottom: 1px solid #555; padding-bottom: 4px;">
            ${d.parentName}
          </div>
          <div style="margin-bottom: 6px;">
            <strong>Total Personnel:</strong> ${totalSoldiers.toLocaleString()}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Movement Flows:</strong> ${totalMovements}
          </div>
        `;
        
        if (!d.isStandalone && d.children.length > 1) {
          tooltipContent += `
            <div style="margin-bottom: 4px; font-weight: bold; color: #ccc;">
              Child Units (${d.children.length}):
            </div>
          `;
          
          // Sort children by soldier count (descending)
          childrenInfo.sort((a, b) => b.soldiers - a.soldiers);
          
          // Show top 5 children to avoid overly long tooltips
          const displayChildren = childrenInfo.slice(0, 5);
          displayChildren.forEach(child => {
            tooltipContent += `
              <div style="margin-left: 8px; font-size: 12px; color: #ddd;">
                • ${child.name}: ${child.soldiers.toLocaleString()} personnel
              </div>
            `;
          });
          
          if (childrenInfo.length > 5) {
            tooltipContent += `
              <div style="margin-left: 8px; font-size: 11px; color: #aaa; font-style: italic;">
                ... and ${childrenInfo.length - 5} more units
              </div>
            `;
          }
        }
        
        tooltipContent += `
          <div style="margin-top: 8px; font-size: 11px; color: #aaa; font-style: italic;">
            Click to focus on this ${d.isStandalone ? 'unit' : 'parent unit'}
          </div>
        `;
        
        tooltip.html(tooltipContent)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(event, d) {
        // Reset parent arc appearance
        d3.select(this).attr("stroke-width", 2);
        
        // Remove tooltip
        d3.selectAll(".parent-tooltip").remove();
      });

    // Add parent labels
    parentGroup.append("text")
      .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", "0.35em")
      .attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${parentInnerRadius + getParentArcWidth(parentSoldierCounts.get(d.parentName) || 0) + 10})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
      .text(d => d.parentName)
      .style("font-weight", "bold")
      .style("font-size", "13px")
      .style("fill", (d, i) => {
        const colorFamilyIndex = parentToColorIndex.get(d.parentName) || 0;
        const parentColor = familyColors[colorFamilyIndex][0];
        return d3.color(parentColor).darker(1.5);
      })
      .style("cursor", "pointer");

      //


    // Add groups (the arcs around the circle) - Inner ring
    const group = mainGroup.append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    // Add arc paths with gradients - Use consistent stroke color
    group.append("path")
      .attr("d", arc)
      .attr("fill", d => `url(#radial-gradient-${d.index})`)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        const unitName = unitNames[d.index];
        const unitId = unitNameToId.get(unitName);
        if (unitId && setClickedNodeID) {
          setClickedNodeID(unitId);
        }
      })
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 3);
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("stroke-width", 2);
      });

    // Add unit labels - Consistent contrast for both modes
    group.append("g")
      .each(function(d) {
        const group = d3.select(this);
        const unitName = unitNames[d.index];
        const unitId = unitNameToId.get(unitName);
        const isSelected = unitId === clickedNodeID;
        
        // Calculate text properties
        const maxLineLength = 15; // Maximum characters per line
        const words = unitName.split(/\s+/);
        const lines = [];
        let currentLine = '';
        
        // Split text into lines
        words.forEach(word => {
          if ((currentLine + ' ' + word).trim().length <= maxLineLength) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Handle case where single word is longer than maxLineLength
              lines.push(word);
            }
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Calculate angle and positioning
        d.angle = (d.startAngle + d.endAngle) / 2;
        const isFlipped = d.angle > Math.PI;
        const lineHeight = 12; // Height between lines
        const totalHeight = (lines.length - 1) * lineHeight;
        const startY = -totalHeight / 2; // Center the multi-line text vertically
        
        // Add each line as a separate text element
        lines.forEach((line, index) => {
          group.append("text")
            .attr("dy", `${startY + (index * lineHeight)}px`)
            .attr("transform", `
              rotate(${(d.angle * 180 / Math.PI - 90)})
              translate(${outerRadius + 10})
              ${isFlipped ? "rotate(180)" : ""}
            `)
            .attr("text-anchor", isFlipped ? "end" : "start")
            .attr("dominant-baseline", "central")
            .text(line)
            .style("font-weight", isSelected ? "900" : "bold")
            .style("font-size", isSelected ? "12px" : "11px")
            .style("fill", () => {
              const colors = unitColorPairs.get(unitName);
              const baseColor = d3.color(colors.color2).darker(1.5);
              return isSelected ? baseColor.darker(0.5) : baseColor;
            })
            .style("cursor", "pointer")
            .on("click", function(event) {
              event.stopPropagation();
              if (unitId && setClickedNodeID) {
                setClickedNodeID(unitId);
              }
            });
        });
      });

    // TODO: Add parent tooltips here
    

    // Add sunrays for recruitments and retirements
    const sunrayLength = radius * 1.8; // Length of the sunray extending outward
    const maxSunrayWidth = (outerRadius - innerRadius) * 1; // Maximum width at the base
    
    // Calculate sunray data for each unit
    const sunrayData = [];
    
    chords.groups.forEach(group => {
      const unitName = unitNames[group.index];
      const unitId = unitNameToId.get(unitName);
      
      // Find recruitments for this unit
      const recruitments = bottomLevelRecruits.filter(r => r.toUnit === unitId);
      const retirements = bottomLevelRestRetirements.filter(r => r.fromUnit === unitId);
      
      // Calculate total recruitment and retirement counts
      const totalRecruitments = recruitments.reduce((sum, r) => sum + r.soldierCount, 0);
      const totalRetirements = retirements.reduce((sum, r) => sum + r.soldierCount, 0);
      
      if (totalRecruitments > 0) {
        sunrayData.push({
          group: group,
          unitName: unitName,
          type: 'recruitment',
          count: totalRecruitments,
          maxCount: Math.max(...bottomLevelRecruits.map(r => r.soldierCount), 1)
        });
      }
      
      if (totalRetirements > 0) {
        sunrayData.push({
          group: group,
          unitName: unitName,
          type: 'retirement', 
          count: totalRetirements,
          maxCount: Math.max(...bottomLevelRestRetirements.map(r => r.soldierCount), 1)
        });
      }
    });
    
    // Create gradients for sunrays
    sunrayData.forEach((sunray, index) => {
      const colors = unitColorPairs.get(sunray.unitName);
      let sunrayColor;
      
      if (sunray.type === 'recruitment') {
        // Light shade for recruitments
        sunrayColor = d3.color(colors.color1).brighter(0.5);
      } else {
        // Dark shade for retirements
        sunrayColor = d3.color(colors.color2).darker(0.8);
      }
      
      const sunrayGradient = defs.append("radialGradient")
        .attr("id", `sunray-gradient-${index}`)
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");
      
      sunrayGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", sunrayColor)
        .attr("stop-opacity", 0.9);
      
      sunrayGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", sunrayColor)
        .attr("stop-opacity", 0.9);
    });
    
    // Create sunray paths
    const sunrayGroup = mainGroup.append("g")
      .attr("class", "sunrays")
      .style("pointer-events", "all"); // Enable interactions for tooltips
    
    sunrayData.forEach((sunray, index) => {
      const group = sunray.group;
      const widthRatio = Math.sqrt(sunray.count / sunray.maxCount); // Use square root for better visual scaling
      const sunrayWidth = maxSunrayWidth * Math.max(widthRatio, 0.2); // Minimum width of 20%
      
      // Calculate the angular span for the sunray base
      const totalAngle = group.endAngle - group.startAngle;
      const sunrayAngle = Math.min(totalAngle * 0.8, sunrayWidth / outerRadius); // Limit sunray angle
      const halfSunrayAngle = sunrayAngle / 2;
      
      // Position sunrays based on type
      let centerAngle;
      if (sunray.type === 'recruitment') {
        // Position recruitment sunrays at the beginning of the unit
        centerAngle = group.startAngle + 1.25 * halfSunrayAngle;
      } else {  // retirement
        // Position retirement sunrays at the end of the unit
        centerAngle = group.endAngle - 1.25 * halfSunrayAngle;
      }
      
      // Define the sunray path points
      const startAngle1 = centerAngle - halfSunrayAngle;
      const startAngle2 = centerAngle + halfSunrayAngle;
      
      // Calculate coordinates for the triangular sunray
      const x1 = Math.cos(startAngle1 - Math.PI/2) * outerRadius;
      const y1 = Math.sin(startAngle1 - Math.PI/2) * outerRadius;
      const x2 = Math.cos(startAngle2 - Math.PI/2) * outerRadius;
      const y2 = Math.sin(startAngle2 - Math.PI/2) * outerRadius;
      
      // Tip of the triangle (far end of sunray)
      const tipX = Math.cos(centerAngle - Math.PI/2) * sunrayLength;
      const tipY = Math.sin(centerAngle - Math.PI/2) * sunrayLength;
      
      // Create rounded base by adding arc between the two base points
      const arcPath = d3.arc()
        .innerRadius(outerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle1)
        .endAngle(startAngle2);
      
      // Create the sunray path with rounded base
      const sunrayPath = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
        L ${tipX} ${tipY}
        Z
      `;
      
      sunrayGroup.append("path")
        .attr("d", sunrayPath)
        .attr("fill", `url(#sunray-gradient-${index})`)
        .attr("stroke", d3.color(unitColorPairs.get(sunray.unitName).color2).darker())
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.6)
        .style("mix-blend-mode", "normal")
        .style("cursor", "pointer")
        .on("mouseover", function(event) {
          // Show tooltip
          const tooltip = d3.select("body").append("div")
            .attr("class", "sunray-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "10px")
            .style("border-radius", "6px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("z-index", "1001")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");
          
          const titleColor = sunray.type === 'recruitment' ? '#28a745' : '#dc3545';
          const titleText = sunray.type === 'recruitment' ? 'New Recruits' : 'Retirements';
          
          tooltip.html(`
            <div style="color: ${titleColor}; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
              ${titleText}
            </div>
            <div style="margin-bottom: 2px;">
              <strong>Unit:</strong> ${sunray.unitName}
            </div>
            <div>
              <strong>Count:</strong> ${sunray.count} ${sunray.type === 'recruitment' ? 'recruits' : 'retirees'}
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
          
          // Highlight the sunray
          d3.select(this)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 1)
            .style("filter", "brightness(1.2)");
        })
        .on("mouseout", function() {
          // Remove tooltip
          d3.selectAll(".sunray-tooltip").remove();
          
          // Reset sunray appearance
          d3.select(this)
            .attr("stroke-width", 0.5)
            .attr("stroke-opacity", 0.6)
            .style("filter", "none");
        });
    });
  }, [bottomLevelMovements, isFullScreen, zoomLevel, panOffset]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render on resize
      if (svgRef.current && bottomLevelMovements.length > 0) {
        // Small delay to ensure container has new dimensions
        setTimeout(() => {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bottomLevelMovements]);

  if (!currentUnits || !pastUnits || bottomLevelMovements.length === 0) {
    return (
      <div className={`chord-diagram-container ${isFullScreen ? 'fullscreen' : ''}`}>
        <div className="no-data-message">
          <p>No soldier movements found between the selected time periods.</p>
          <p>Please ensure data is available for both dates and units have soldier movements.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`chord-diagram-container ${isFullScreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      style={{
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : 'auto',
        left: isFullScreen ? 0 : 'auto',
        width: isFullScreen ? '100vw' : '100%',
        height: isFullScreen ? '100vh' : '800px',
        backgroundColor: '#ffffff',
        zIndex: isFullScreen ? 9999 : 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div className="chord-diagram-header">
        <div className="header-info">
          <h3>Soldier Movement Analysis</h3>
          <p>{bottomCurrentUnits.length} units • Level {levels} depth • {movementStats.totalMovements} movement flows</p>
          <p style={{ fontSize: '13px', color: '#666', margin: '2px 0' }}>
            From: <strong>{pastDate}</strong> → To: <strong>{selectedDate}</strong>
          </p>
          {movementStats.totalSoldiers > 0 && (
            <span style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              {movementStats.totalSoldiers} soldiers moved • {movementStats.transferSoldiers} transfers • {movementStats.recruitmentSoldiers} new • {movementStats.departureSoldiers} departed
            </span>
          )}
        </div>
        <div className="header-controls">
          <div className="view-toggle">
            <label style={{ fontSize: '12px', marginRight: '8px', color: '#666' }}>View:</label>
            <button 
              className={`toggle-btn ${isGrouped ? 'active' : ''}`}
              onClick={() => setIsGrouped(true)}
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px', 
                marginRight: '4px',
                backgroundColor: isGrouped ? '#007bff' : '#f8f9fa',
                color: isGrouped ? 'white' : '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer'
              }}
            >
              Grouped
            </button>
            <button 
              className={`toggle-btn ${!isGrouped ? 'active' : ''}`}
              onClick={() => setIsGrouped(false)}
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px', 
                marginRight: '16px',
                backgroundColor: !isGrouped ? '#007bff' : '#f8f9fa',
                color: !isGrouped ? 'white' : '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer'
              }}
            >
              Separated
            </button>
          </div>
          <div className="levels-controls">
            <label style={{ fontSize: '12px', marginRight: '8px', color: '#666' }}>Depth:</label>
            <button 
              className="level-btn" 
              onClick={() => setLevels(prev => Math.max(prev - 1, 1))} 
              disabled={levels <= 1}
              style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
            >
              −
            </button>
            <span style={{ margin: '0 8px', fontSize: '13px', fontWeight: 'bold' }}>{levels}</span>
            <button 
              className="level-btn" 
              onClick={() => setLevels(prev => Math.min(prev + 1, 10))} 
              disabled={levels >= 10}
              style={{ padding: '4px 8px', fontSize: '12px', marginRight: '16px' }}
            >
              +
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

      {/* SVG Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab'
      }}>
        <svg
          ref={svgRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            userSelect: 'none'
          }}
        />
      </div>

      {/* Legend */}
      <div className="chord-legend" style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(248, 249, 250, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '1px solid #dee2e6',
        color: '#495057'
      }}>
        <div><strong>Chord Colors:</strong> Gradient based on destination unit</div>
        <div><strong>Arc Colors:</strong> Radial gradient unique to each unit</div>
        <div><strong>Arc Size:</strong> Total soldier flow</div>
        <div><strong>Chord Width:</strong> Number of soldiers moved</div>
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#6c757d' }}>
          💡 Hover over chords for details • Use Ctrl/Cmd + scroll to zoom
        </div>
      </div>
    </div>
  );
};

ChordDiagram.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  pastDate: PropTypes.string.isRequired,
  rootUnit: PropTypes.string.isRequired,
  childUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  parallelUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ChordDiagram;