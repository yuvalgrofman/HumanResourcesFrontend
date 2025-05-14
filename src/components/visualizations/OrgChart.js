import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';

const OrgChart = () => {
  const { units, selectUnit, loading } = useData();
  const svgRef = useRef();
  
  useEffect(() => {
    if (loading || !units || units.length === 0) return;
    
    // Transform the data into hierarchy format
    const processData = (data) => {
      const hierarchy = data.map(item => {
        return {
          id: item.unit_id,
          name: item.unit_name,
          parent: item.parent_unit_id,
          value: item.total_personnel,
          regularSoldiers: item.regular_soldiers,
          officers: item.officers,
          seniorOfficers: item.senior_officers,
          children: item.sub_units && item.sub_units.length > 0 ? processData(item.sub_units) : []
        };
      });
      return hierarchy;
    };
    
    const hierarchyData = { 
      name: "Army",
      children: processData(units)
    };

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Define dimensions
    const width = 800;
    const height = 600;
    const margin = { top: 50, right: 90, bottom: 50, left: 90 };
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Create hierarchy and tree layout
    const root = d3.hierarchy(hierarchyData);
    const treeLayout = d3.tree().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    treeLayout(root);
    
    // Add links
    svg.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5);
      
    // Add nodes
    const nodes = svg.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => {
        if (d.data.id) {
          selectUnit(d.data.id);
        }
      })
      .style('cursor', 'pointer');
      
    // Add node circles
    nodes.append('circle')
      .attr('r', d => {
        // Size circle based on personnel count (min 5px, max 15px)
        if (!d.data.value) return 5;
        return Math.max(5, Math.min(15, 5 + d.data.value / 100));
      })
      .attr('fill', '#4285F4')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
      
    // Add labels
    nodes.append('text')
      .attr('dy', '.35em')
      .attr('x', d => d.children ? -13 : 13)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => {
        if (d.data.name === "Army" && !d.data.id) return "";
        return d.data.name;
      })
      .style('font-size', '12px');
      
    // Add tooltips - using simple title for now
    nodes.append('title')
      .text(d => {
        if (!d.data.id) return "";
        return `${d.data.name}\nID: ${d.data.id}\nTotal: ${d.data.value || 'N/A'}\nRegular: ${d.data.regularSoldiers || 'N/A'}\nOfficers: ${d.data.officers || 'N/A'}\nSenior Officers: ${d.data.seniorOfficers || 'N/A'}`;
      });
      
    // Add personnel count
    nodes.append('text')
      .attr('dy', '1.5em')
      .attr('x', d => d.children ? -13 : 13)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.value ? `(${d.data.value})` : '')
      .style('font-size', '10px')
      .style('fill', '#666');

  }, [units, loading, selectUnit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No data available. Please check your connection to the API.</p>
      </div>
    );
  }

  return (
    <div className="org-chart-container flex items-center justify-center overflow-auto p-4 h-full">
      <svg ref={svgRef} className="org-chart" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
};

export default OrgChart;