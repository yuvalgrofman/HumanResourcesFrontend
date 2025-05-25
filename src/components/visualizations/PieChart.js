import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import "./PieChart.css";

const PieChart = ({ data, height = 200, width = 200 }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const filteredData = data.filter(d => d.value > 0);
    if (filteredData.length === 0) return;
    
    d3.select(svgRef.current).selectAll('*').remove();
    
    const radius = Math.min(width, height) / 1.6;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
        
    const color = d3.scaleOrdinal()
      .domain(filteredData.map(d => d.name))
      .range(filteredData.map(d => d.color || '#' + Math.floor(Math.random()*16777215).toString(16)));
        
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
        
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius * 0.8);
        
    const outerArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);
        
    const arcs = svg.selectAll('.arc')
      .data(pie(filteredData))
      .enter()
      .append('g')
      .attr('class', 'arc');
        
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8);
        
    arcs.append('title')
      .text(d => `${d.data.name}: ${d.data.value} (${Math.round(d.data.value / d3.sum(filteredData, d => d.value) * 100)}%)`);
        
    if (radius > 50) {
      arcs.append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          return `translate(${pos[0]},${pos[1]})`;
        })
        .attr('dy', '.35em')
        .text(d => {
          const percent = Math.round(d.data.value / d3.sum(filteredData, d => d.value) * 100);
          return percent >= 5 ? `${percent}%` : '';
        })
        .attr('text-anchor', 'middle');
    }
    
    const legend = svg.selectAll('.legend')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${radius + 10},${-radius + i * 20})`);
        
    legend.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => color(d.name));
        
    legend.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .text(d => `${d.name} (${d.value})`);
        
  }, [data, height, width]);
  
  // Empty state within styled container
  if (!data || data.length === 0) {
    return (
      <div className="pie-chart-container flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">No personnel data available</p>
      </div>
    );
  }
  
  return (
    <div className="pie-chart-container">
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default PieChart;
