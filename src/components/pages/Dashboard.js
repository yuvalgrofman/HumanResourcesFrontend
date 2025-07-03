import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Import images
import ChordDiagramImage from '../../images/ChordDiagram.jpeg';
import GroupChartImage from '../../images/GroupChart.jpeg';
import ArrowChartImage from '../../images/ArrowChart.jpeg';
import OrgChartImage from '../../images/OrgChart.jpeg';
import TimeGraphImage from '../../images/TimeGraph.jpeg';

const Dashboard = () => {
  const navigate = useNavigate();

  const visualizations = [
    {
      id: 'chord-diagram',
      title: 'Chord Diagram',
      route: '/chord-diagram',
      image: ChordDiagramImage,
      description: 'Visualizes the movement of soldiers between units in the Army using an interactive chord diagram that shows the flow and relationships between different organizational units.',
      dimensions: '880 × 830'
    },
    {
      id: 'group-chart',
      title: 'Group Chart',
      route: '/group-chart',
      image: GroupChartImage,
      description: 'Shows an organizational chart where movements between units are propagated to parent units, revealing mass movements between larger organizational divisions.',
      dimensions: '1280 × 370'
    },
    {
      id: 'arrow-chart',
      title: 'Arrow Chart',
      route: '/arrow-chart',
      image: ArrowChartImage,
      description: 'Displays an organizational chart with arrows representing direct movements between units, providing a clear visual representation of personnel transfers.',
      dimensions: '1280 × 380'
    },
    {
      id: 'org-chart',
      title: 'Organization Chart',
      route: '/org-chart',
      image: OrgChartImage,
      description: 'Presents the organizational structure with unit cards containing three horizontal bars that track changes in different soldier types (Talions, Psagot, Academic) over time.',
      dimensions: '1280 × 390'
    },
    {
      id: 'time-graph',
      title: 'Time Graph',
      route: '/time-graph',
      image: TimeGraphImage,
      description: 'A timeline visualization that allows placing multiple units and tracking how soldier populations in each unit change over time periods.',
      dimensions: '1280 × 380'
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Army HR Analytics Dashboard</h1>
        <p>Select a visualization to analyze human resources data and personnel movements</p>
      </div>

      <div className="dashboard-grid">
        {visualizations.map((viz) => (
          <div
            key={viz.id}
            className="dashboard-card"
            onClick={() => handleCardClick(viz.route)}
            data-tooltip={viz.description}
          >
            <div className="card-image-container">
              <img
                src={viz.image}
                alt={viz.title}
                className="card-image"
                loading="lazy"
              />
              <div className="card-overlay">
                <div className="card-overlay-content">
                  <h3>{viz.title}</h3>
                  <p>Click to explore</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{viz.title}</h3>
              <div className="card-dimensions">{viz.dimensions}</div>
            </div>
            <div className="card-tooltip">
              <div className="tooltip-content">
                <h4>{viz.title}</h4>
                <p>{viz.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-footer">
        <p>Hover over cards for detailed descriptions • Click to navigate to visualization</p>
      </div>
    </div>
  );
};

export default Dashboard;