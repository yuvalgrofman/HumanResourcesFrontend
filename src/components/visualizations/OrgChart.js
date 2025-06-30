import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import './OrgChart.css';

const OrgChart = ({ selectedDate, pastDate, rootUnit, childUnits, parallelUnits, clickedNodeID, setClickedNodeID, levels = 3 }) => {
  const { currentUnits, pastUnits } = useData();
  const [flatCurrentUnits, setFlatCurrentUnits] = useState([]);
  const [flatPastUnits, setFlatPastUnits] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const svgRef = useRef();
  const containerRef = useRef();

  console.log(currentUnits)

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

  // Handle node click
  const handleNodeClick = (nodeId) => {
    setClickedNodeID(nodeId);
  };

  const findUnitById = (units, unitId) => units.find(unit => unit.id === unitId);

  // Convert unit to card format
  // const convertToCardFormat = (unit) => {
  //   if (!unit) return null;
  //   const randomValue = Math.floor(Math.random() * 30 + 20);
  //   const randomValue2 = Math.floor(Math.random() * 20 + 15);
  //   const randomValue3 = Math.floor(Math.random() * 10 + 5);
  //   const randomValue4 = Math.floor(Math.random() * 100);
  //   return { R1: randomValue, R2: randomValue2, R3: randomValue3, Total: randomValue4 };
  // };

  const convertToCardFormat = (unit) => {
    if (!unit) return { R1: 0, R2: 0, R3: 0, Total: 0 };
    // return {
    //   R1: unit.regular_soldiers || 0,
    //   R2: unit.officers || 0,
    //   R3: unit.senior_officers || 0,
    //   Total: unit.total_personnel || 0
    // };
    return {
      R1: unit.roles["Type 1"].length || 0,
      R2: unit.roles["Type 2"].length || 0,
      R3: unit.roles["Type 3"].length || 0,
      Total: unit.total_personnel || 0
    }
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

  const createHorizontalBar = (label, currentValue, lastValue, minValue = 0, maxValue = 50) => {
    // Clamp values to min/max range
    const clamp = (v) => Math.min(Math.max(v, minValue), maxValue);
    const curr = clamp(currentValue);
    const last = clamp(lastValue);
    const range = maxValue - minValue;

    // Calculate percentages based on HorizontalBar.js logic
    const equalVal = Math.min(curr, last);
    const equalPct = ((equalVal - minValue) / range) * 100;
    const diffPct = (Math.abs(curr - last) / range) * 100;
    const currPct = ((curr - minValue) / range) * 100;
    const lastPct = ((last - minValue) / range) * 100;
    
    // Define colors matching CSS variables pattern
    const growthColor = '#28a745';
    const declineColor = '#dc3545';
    const neutralColor = '#D3D3D3';
    
    const diffColor = curr >= last ? growthColor : declineColor;

    return `
      <div style="display: flex; align-items: center; margin-bottom: 8px; width: 100%;">
        <span style="margin-right: 8px; font-weight: 800; white-space: nowrap; font-size: 14px; color: #495057;">${label}</span>
        <div style="
          flex: 1;
          position: relative;
          height: 20px;
          background-color: white;
          border: 2px solid black;
          overflow: hidden;
        ">
          <!-- Neutral segment (common part) -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: ${equalPct}%;
            background-color: ${diffColor};
          "></div>
          
          <!-- Difference segment -->
          <div style="
            position: absolute;
            top: 0;
            left: ${equalPct}%;
            width: ${diffPct}%;
            height: 100%;
            background-color: ${neutralColor};
          "></div>
          
          <!-- Current value line -->
          <div style="
            position: absolute;
            top: 0;
            left: ${currPct}%;
            height: 100%;
            width: 0;
            border-left: 2px solid black;
          "></div>
          
          <!-- Last value line (dashed) -->
          <div style="
            position: absolute;
            top: 0;
            left: ${lastPct}%;
            height: 100%;
            width: 0;
            border-left: 1px dashed black;
          "></div>
        </div>
      </div>
    `;
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

    // Create main group for zoom/pan
    const g = svg.append('g')
      .attr('class', 'tree-container')
      .attr('transform', `translate(${treeWidth/2 + 100},100)`);

    // Add links (connections between nodes)
    // Only show links from root to its children, not to parallel units
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
        return `M${source.x},${source.y + nodeHeight/2}
                L${source.x},${source.y + nodeHeight/2 + 30}
                L${target.x},${target.y - 30}
                L${target.x},${target.y}`;
      })
      .style('fill', 'none')
      .style('stroke', '#37B7C3')
      .style('stroke-width', '2px');

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
        
        // Determine border color based on node type and clicked state
        let borderColor = '#000'; // Default black for regular nodes
        let borderWidth = '2px';
        let boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        
        if (isClicked) {
          borderColor = '#ff6b35'; // Orange for clicked node
          borderWidth = '3px';
          boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3), 0 0 0 2px rgba(255, 107, 53, 0.2)';
        } else if (isRoot) {
          borderColor = '#007bff'; // Blue for root node
        } else if (isParallel) {
          borderColor = '#6f42c1'; // Purple for parallel unit nodes
        }
        
        // Create ParallelUnitCard-style HTML
        this.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            font-family: Arial, sans-serif;
            box-shadow: ${boxShadow};
            border-radius: 8px;
            border: ${borderWidth} solid ${borderColor};
            overflow: hidden;
            background: white;
            transition: all 0.2s ease;
          ">
            <!-- Info Section (top part) -->
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 12px;
              background-color: ${backgroundColor};
              color: ${diff === 0 ? '#000' : '#fff'};
              border-top-left-radius: 6px;
              border-top-right-radius: 6px;
              min-height: 80px;
            ">
              <div style="
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 0px;
                // color: black;
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
                ${currentAmount.Total}
              </div>
            </div>
            
            <!-- Bars Section (bottom part) -->
            <div style="
              padding-top: 6px;
              padding-left: 10px;
              padding-right: 10px;
              background: white;
              flex: 1;
              border-bottom-left-radius: 6px;
              border-bottom-right-radius: 6px;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                margin-bottom: 0px;
                font-size: 16px;
                font-weight: 700;
                color: #6c757d;
                padding-left: 24px;
                padding-right: 3px;
              ">
                <span>0</span>
                <span>50</span>
              </div>
              
              ${createHorizontalBar('R1', currentAmount.R1, lastAmount.R1)}
              ${createHorizontalBar('R2', currentAmount.R2, lastAmount.R2)}
              ${createHorizontalBar('R3', currentAmount.R3, lastAmount.R3)}
            </div>
          </div>
        `;
      });

    // Apply zoom and pan transforms
    g.attr('transform', 
      `translate(${treeWidth/2 + 100 + panOffset.x / zoomLevel},${100 + panOffset.y / zoomLevel}) scale(${zoomLevel})`
    );

  }, [buildTreeData, flatPastUnits, rootUnit, parallelUnits, zoomLevel, panOffset, clickedNodeID]);

  if (!buildTreeData) {
    return (
      <div className={`org-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
        <div className="org-chart-message">
          <p>Please select a root unit to display the organizational chart.</p>
        </div>
      </div>
    );
  }

  const totalNodes = flatCurrentUnits.length;
  const maxDepth = buildTreeData ? d3.hierarchy(buildTreeData).height + 1 : 0;
  const displayedDepth = Math.min(maxDepth, levels);
  
  return (
    <div className={`org-chart-container ${isFullScreen ? 'fullscreen' : ''}`}>
      <div className="org-chart-header">
        <div className="header-info">
          <h3>Organizational Structure</h3>
          <p>{displayedDepth} levels • {totalNodes} total units • Showing {levels} level{levels !== 1 ? 's' : ''}</p>
          {clickedNodeID && (
            <p style={{ color: '#ff6b35', fontWeight: 'bold' }}>
              Selected: {flatCurrentUnits.find(u => u.id === clickedNodeID)?.name || clickedNodeID}
            </p>
          )}
        </div>
        <div className="header-controls">
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
        className="org-chart-scroll-container" 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp} 
        onWheel={handleWheel} 
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div className="org-chart-viewport">
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }}>
          </svg>
        </div>
      </div>
      <div className="org-chart-instructions">
        <p>Use mouse wheel + Ctrl to zoom • Click and drag to pan • Ctrl+0 to reset • Click on nodes to select them • {isFullScreen ? 'Press Esc or F to exit full screen' : 'Press F or F11 for full screen'}</p>
      </div>
    </div>
  );
};

OrgChart.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  pastDate: PropTypes.string.isRequired,
  rootUnit: PropTypes.string.isRequired,
  childUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  parallelUnits: PropTypes.arrayOf(PropTypes.string).isRequired,
  clickedNodeID: PropTypes.string,
  setClickedNodeID: PropTypes.func.isRequired,
  levels: PropTypes.number,
};

export default OrgChart;