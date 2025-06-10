import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import "./TimeGraph.css";

const TimeGraph = ({ data, height = 200, width = 310 }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Define margins with more space for modern look
    const margin = { top: 20, right: 30, bottom: 50, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'time-graph-svg');
      
    // Add background gradient
    const defs = svg.append('defs');
    
    // Gradient for line
    const gradient = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.1);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.8);
    
    // Area gradient
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);
    
    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.05);
    
    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.2);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Define scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(sortedData, d => new Date(d.date)))
      .range([0, innerWidth]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(sortedData, d => d.total_personnel) * 1.1])
      .range([innerHeight, 0]);
    
    // Create grid lines
    const xGrid = d3.axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickFormat('')
      .ticks(5);
      
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat('')
      .ticks(5);
    
    // Add grid
    g.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xGrid);
      
    g.append('g')
      .attr('class', 'grid y-grid')
      .call(yGrid);
      
    // Create area generator
    const area = d3.area()
      .x(d => xScale(new Date(d.date)))
      .y0(innerHeight)
      .y1(d => yScale(d.total_personnel))
      .curve(d3.curveCardinal.tension(0.3));
      
    // Create line generator
    const line = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.total_personnel))
      .curve(d3.curveCardinal.tension(0.3));
    
    // Add area
    g.append('path')
      .datum(sortedData)
      .attr('class', 'area-path')
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);
      
    // Add line path with animation
    const path = g.append('path')
      .datum(sortedData)
      .attr('class', 'line-path')
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line);
    
    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCircleOut)
      .attr('stroke-dashoffset', 0);
    
    // Create tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'time-graph-tooltip')
      .style('opacity', 0);
    
    // Add data points with enhanced interactivity
    const circles = g.selectAll('.data-point')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(new Date(d.date)))
      .attr('cy', d => yScale(d.total_personnel))
      .attr('r', 0)
      .attr('fill', '#3B82F6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);
    
    // Animate circles
    circles.transition()
      .delay((d, i) => i * 100 + 800)
      .duration(400)
      .ease(d3.easeBounceOut)
      .attr('r', 5);
    
    // Add hover effects
    circles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8)
          .attr('stroke-width', 3);
          
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
          
        tooltip.html(`
          <div class="tooltip-content">
            <div class="tooltip-date">${new Date(d.date).toLocaleDateString()}</div>
            <div class="tooltip-value">${d.total_personnel.toLocaleString()}</div>
            <div class="tooltip-label">Total Personnel</div>
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5)
          .attr('stroke-width', 2);
          
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Add x-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(sortedData.length, 10))
      .tickFormat(d3.timeFormat('%y'));
      
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-35)')
      .attr('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');
      
    // Add y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => {
        if (d >= 1000) {
          return (d / 1000).toFixed(d % 1000 === 0 ? 0 : 1) + 'K';
        }
        return d.toString();
      });
      
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);
    
    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label x-label')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
      .text('Year');
      
  }, [data, height, width]);
  
  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      d3.select(containerRef.current).select('.time-graph-tooltip').remove();
    };
  }, []);
  
  if (!data || data.length === 0) {
    return (
      <div className="time-graph-empty">
        <div className="empty-icon">
          <i className="fas fa-chart-line"></i>
        </div>
        <p className="empty-text">No time series data available</p>
      </div>
    );
  }
  
  return (
    <div className="time-graph-container" ref={containerRef}>
      <svg ref={svgRef} className="time-graph-svg"></svg>
    </div>
  );
};

export default TimeGraph;