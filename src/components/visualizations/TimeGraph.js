import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import "./TimeGraph.css"; // Assuming you have some CSS for styling

const TimeGraph = ({ data, height = 150, width = 250 }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Define margins
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Define scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(sortedData, d => new Date(d.date)))
      .range([0, innerWidth]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(sortedData, d => d.total_personnel) * 1.1]) // Adding 10% padding
      .range([innerHeight, 0]);
      
    // Create line generator
    const line = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.total_personnel))
      .curve(d3.curveMonotoneX);
      
    // Add line path
    svg.append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', '#4285F4')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add data points
    svg.selectAll('.data-point')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(new Date(d.date)))
      .attr('cy', d => yScale(d.total_personnel))
      .attr('r', 4)
      .attr('fill', '#4285F4');
      
    // Add tooltip to data points
    svg.selectAll('.data-point')
      .append('title')
      .text(d => `Date: ${d.date}\nTotal: ${d.total_personnel}`);
    
    // Add x-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(data.length, 5))
      .tickFormat(d3.timeFormat('%m/%d/%y'));
      
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '8px')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');
      
    // Add y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5);
      
    svg.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '8px');
      
  }, [data, height, width]);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">No time series data available</p>
      </div>
    );
  }
  
  return (
    <div className="time-graph-container">
      <svg ref={svgRef} width={width} height={height} className="mx-auto"></svg>
    </div>
  );
};

export default TimeGraph;