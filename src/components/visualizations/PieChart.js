import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import "./PieChart.css";

const PieChart = ({ data, height = 300, width = 310 }) => {
  const svgRef = useRef();
  const imageHeight = 240
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const filteredData = data.filter(d => d.value > 0);
    if (filteredData.length === 0) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    const radius = Math.min(width, imageHeight) / 2.5;
    const innerRadius = radius * 0.45; // Create donut chart
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${width / 2},${imageHeight / 2 - 10})`);
    
    // Color scale with modern colors matching DataPanel
    const colorMap = {
      'Regular Soldiers': '#3B82F6',
      'Officers': '#10B981', 
      'Senior Officers': '#F59E0B'
    };
    
    const color = d3.scaleOrdinal()
      .domain(filteredData.map(d => d.name))
      .range(filteredData.map(d => colorMap[d.name] || d.color || '#64748B'));
    
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.02); // Small padding between slices
    
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius);
    
    const hoverArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8);
    
    // Create pie slices
    const arcs = chartGroup.selectAll('.pie-slice')
      .data(pie(filteredData))
      .enter()
      .append('g')
      .attr('class', 'pie-slice');
    
    // Add slice paths with animation
    const paths = arcs.append('path')
      .attr('class', 'slice-path')
      .attr('fill', d => color(d.data.name))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .style('cursor', 'pointer');
    
    // Animate slice entrance
    paths
      .transition()
      .duration(800)
      .ease(d3.easeElastic.period(0.4))
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
    
    // Add hover effects
    paths
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))');
        
        // Show tooltip
        showTooltip(event, d);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
        
        hideTooltip();
      });
    
    // Add percentage labels on slices
    const labels = arcs.append('text')
      .attr('class', 'slice-label')
      .attr('transform', d => {
        const centroid = arc.centroid(d);
        return `translate(${centroid[0]}, ${centroid[1]})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', 'white')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.3)')
      .style('opacity', 0);
    
    // Show percentage if slice is large enough
    labels
      .text(d => {
        const percent = Math.round(d.data.value / d3.sum(filteredData, d => d.value) * 100);
        return percent >= 8 ? `${percent}%` : '';
      })
      .transition()
      .delay(400)
      .duration(400)
      .style('opacity', 1);
    
    // Add center total
    const total = d3.sum(filteredData, d => d.value);
    const centerGroup = chartGroup.append('g')
      .attr('class', 'center-info')
      .style('opacity', 0);
    
    centerGroup
      .transition()
      .delay(600)
      .duration(400)
      .style('opacity', 1);
    
    // Create custom legend
    createLegend(svg, filteredData, color, width, imageHeight);
    
    // Tooltip functions
    function showTooltip(event, d) {
      const tooltip = d3.select('body').selectAll('.pie-tooltip')
        .data([0]);
      
      const tooltipEnter = tooltip.enter()
        .append('div')
        .attr('class', 'pie-tooltip')
        .style('opacity', 0);
      
      const tooltipUpdate = tooltipEnter.merge(tooltip);
      
      const percent = Math.round(d.data.value / d3.sum(filteredData, d => d.value) * 100);
      
      tooltipUpdate
        .html(`
          <div class="tooltip-header">${d.data.name}</div>
          <div class="tooltip-content">
            <div class="tooltip-value">${d.data.value} personnel</div>
            <div class="tooltip-percent">${percent}% of total</div>
          </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
    }
    
    function hideTooltip() {
      d3.select('.pie-tooltip')
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove();
    }
    
  }, [data, imageHeight, width]);
  
  // Create legend function
  const createLegend = (svg, data, color, width, imageHeight) => {
    const legendGroup = svg.append('g')
      .attr('class', 'pie-legend')
      .attr('transform', `translate(20, ${imageHeight + 60 - data.length * 25 - 10})`);
    
    const legend = legendGroup.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .style('opacity', 0);
    
    // Legend color indicators
    legend.append('circle')
      .attr('cx', 8)
      .attr('cy', 8)
      .attr('r', 6)
      .attr('fill', d => color(d.name))
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');
    
    // Legend text
    legend.append('text')
      .attr('x', 20)
      .attr('y', 8)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(d => d.name);
    
    // Legend values
    legend.append('text')
      .attr('x', 20)
      .attr('y', 22)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '400')
      .style('fill', '#6b7280')
      .text(d => `${d.value} personnel`);
    
    // Animate legend appearance
    legend
      .transition()
      .delay((d, i) => 800 + i * 100)
      .duration(400)
      .style('opacity', 1);
  };
  
  // Empty state
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="pie-chart-container">
        <div className="pie-empty-state">
          <div className="empty-icon">
            <i className="fas fa-chart-pie"></i>
          </div>
          <p>No personnel data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pie-chart-container">
      <svg ref={svgRef} className="pie-chart-svg"></svg>
    </div>
  );
};

export default PieChart;