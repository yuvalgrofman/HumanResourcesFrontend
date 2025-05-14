// src/components/OrgChart.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useData } from '../contexts/DataContext';  // brings in selectedDate :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}

const OrgChart = ({ unit }) => {
  const { selectedDate } = useData();
  const svgRef = useRef(null);
  const [filterText, setFilterText] = useState('');
  const [rootNode, setRootNode] = useState(null);
  const [tick, setTick] = useState(0); // to force redraw on collapse/expand

  // ——————————————————————————————————————————————————————————
  // 1) Initialize the D3 hierarchy (with collapse state)
  // ——————————————————————————————————————————————————————————
  useEffect(() => {
    if (!unit) return;

    // Deep‐clone the incoming data so toggling children doesn't mutate props
    const dataClone = JSON.parse(JSON.stringify(unit));

    // Build a d3.hierarchy, using sub_units
    const root = d3.hierarchy(dataClone, d => d.sub_units);
    root.descendants().forEach(d => {
      // keep a pointer to hidden children for collapse/expand
      d._children = d.children;
      // collapse all but the root level by default
      if (d.depth > 1) d.children = null;
    });

    setRootNode(root);
  }, [unit, selectedDate]);

  // Helper to force an update (so useEffect below will re‐draw)
  const triggerUpdate = useCallback(() => setTick(t => t + 1), []);

  // ——————————————————————————————————————————————————————————
  // 2) Update / render routine
  // ——————————————————————————————————————————————————————————
  useEffect(() => {
    if (!rootNode) return;

    const svgEl = svgRef.current;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // layout parameters
    const width = svgEl.clientWidth || 800;
    const dx = 80;
    const dy = 200;
    const tree = d3.tree().nodeSize([dx, dy]);
    tree(rootNode);

    // apply filter: mark each node whether it matches
    rootNode.each(d => {
      const nameMatch = d.data.unit_name
        .toLowerCase()
        .includes(filterText.toLowerCase());
      const totalMatch = filterText !== '' && !isNaN(+filterText)
        ? d.data.total_personnel >= +filterText
        : false;
      d.match = filterText === '' ? true : nameMatch || totalMatch;
    });

    // set up viewBox to fit
    let x0 = Infinity, x1 = -x0;
    rootNode.each(d => {
      if (d.x < x0) x0 = d.x;
      if (d.x > x1) x1 = d.x;
    });
    svg
      .attr('viewBox', [-dy / 2, x0 - dx, width, x1 - x0 + dx * 2])
      .style('font', '10px sans-serif');

    // LINKS (straight lines)
    svg.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(rootNode.links())
      .join('line')
        .attr('x1', d => d.source.y)
        .attr('y1', d => d.source.x)
        .attr('x2', d => d.target.y)
        .attr('y2', d => d.target.x)
        .style('opacity', d => (d.target.match ? 1 : 0.3));

    // NODES
    const nodeG = svg.append('g')
      .selectAll('g')
      .data(rootNode.descendants())
      .join('g')
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          // toggle children
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          triggerUpdate();
        });

    // RECTANGLE background
    nodeG.append('rect')
      .attr('x', -75)
      .attr('y', -35)
      .attr('width', 150)
      .attr('height', 70)
      .attr('fill', d => d.match ? levelStyles[d.depth].fill : '#eee')
      .attr('stroke', d => levelStyles[d.depth].stroke)
      .attr('stroke-width', 1.5)
      .style('opacity', d => d.match ? 1 : 0.3);

    // ICON + UNIT NAME
    nodeG.append('text')
      .attr('dy', -18)
      .attr('text-anchor', 'middle')
      .text(d => `${levelIcons[d.depth]} ${d.data.unit_name}`)
      .style('font-weight', 'bold')
      .style('opacity', d => d.match ? 1 : 0.3);

    // BARS & ICON LABELS for personnel counts
    const barMaxWidth = 130;
    nodeG.each(function(d) {
      const g = d3.select(this);
      const total = d.data.total_personnel || 1;
      // regular soldiers
      g.append('rect')
        .attr('x', -65)
        .attr('y', -5)
        .attr('width', (d.data.regular_soldiers / total) * barMaxWidth)
        .attr('height', 6)
        .style('opacity', d.match ? 1 : 0.3);
      g.append('text')
        .attr('x', 80)
        .attr('y', 0)
        .attr('dy', 4)
        .text(`👥 ${d.data.regular_soldiers}`)
        .style('font-size', '8px')
        .style('opacity', d.match ? 1 : 0.3);

      // officers
      g.append('rect')
        .attr('x', -65)
        .attr('y', 8)
        .attr('width', (d.data.officers / total) * barMaxWidth)
        .attr('height', 6)
        .style('opacity', d.match ? 1 : 0.3);
      g.append('text')
        .attr('x', 80)
        .attr('y', 12)
        .attr('dy', 4)
        .text(`🎖️ ${d.data.officers}`)
        .style('font-size', '8px')
        .style('opacity', d.match ? 1 : 0.3);

      // senior officers
      g.append('rect')
        .attr('x', -65)
        .attr('y', 21)
        .attr('width', (d.data.senior_officers / total) * barMaxWidth)
        .attr('height', 6)
        .style('opacity', d.match ? 1 : 0.3);
      g.append('text')
        .attr('x', 80)
        .attr('y', 25)
        .attr('dy', 4)
        .text(`⭐ ${d.data.senior_officers}`)
        .style('font-size', '8px')
        .style('opacity', d.match ? 1 : 0.3);
    });
  }, [rootNode, filterText, tick]);

  // Styles & icons by depth
  const levelStyles = {
    0: { fill: '#f5f5f5', stroke: '#999' },
    1: { fill: '#e8f5e9', stroke: '#2e7d32' },
    2: { fill: '#e3f2fd', stroke: '#1565c0' },
    3: { fill: '#fff3e0', stroke: '#ef6c00' }
  };
  const levelIcons = {
    0: '🏰',
    1: '🛡️',
    2: '⚔️',
    3: '🎖️'
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="Filter by name or min total personnel"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ padding: '4px', width: '250px' }}
        />
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
};

export default OrgChart;
