# OrgChart Component

A sophisticated React component for visualizing organizational hierarchies with interactive features, comparison capabilities, and real-time data visualization. Built with D3.js for powerful tree rendering and designed for military or corporate organizational structures.

## Features

### Core Functionality
- **Hierarchical Visualization**: Interactive tree-based organizational chart
- **Temporal Comparison**: Compare current vs. past organizational states
- **Flexible Unit Types**: Support for root units, child units, and parallel units
- **Personnel Tracking**: Displays regular soldiers, officers, senior officers, and totals
- **Growth Indicators**: Visual indicators for personnel increases, decreases, or stability

### Interactive Controls
- **Zoom & Pan**: Mouse wheel zoom with Ctrl modifier, click-and-drag panning
- **Full Screen Mode**: Toggle full screen view with F key or dedicated button
- **Node Selection**: Click nodes to select and highlight them
- **Keyboard Shortcuts**: Comprehensive keyboard navigation support
- **Depth Control**: Configurable tree depth display (1-3+ levels)

### Visual Features
- **Color-Coded Growth**: Background colors indicate personnel changes
- **Horizontal Bar Charts**: Visual representation of different personnel types
- **Node Styling**: Different border colors for root, parallel, and selected nodes
- **Growth Icons**: Trending arrows showing increase/decrease/stable states
- **Responsive Design**: Adapts to container size and full screen mode

## Installation

```bash
npm install react d3 prop-types
```

## Dependencies

- React (with Hooks support)
- D3.js v7+
- PropTypes
- CSS file: `./OrgChart.css`
- Data Context: `../../context/DataContext`

## Usage

### Basic Implementation

```jsx
import React, { useState } from 'react';
import OrgChart from './components/OrgChart/OrgChart';
import { DataProvider } from './context/DataContext';

function App() {
  const [clickedNodeID, setClickedNodeID] = useState(null);
  
  return (
    <DataProvider>
      <OrgChart
        selectedDate="2024-01-15"
        pastDate="2023-12-15"
        rootUnit="UNIT_001"
        childUnits={["UNIT_002", "UNIT_003", "UNIT_004"]}
        parallelUnits={["UNIT_005", "UNIT_006"]}
        clickedNodeID={clickedNodeID}
        setClickedNodeID={setClickedNodeID}
        levels={3}
      />
    </DataProvider>
  );
}
```

### Advanced Configuration

```jsx
<OrgChart
  selectedDate="2024-06-01"
  pastDate="2024-01-01"
  rootUnit="HQ_BATTALION"
  childUnits={["ALPHA_COMPANY", "BRAVO_COMPANY", "CHARLIE_COMPANY"]}
  parallelUnits={["SUPPORT_UNIT", "LOGISTICS_UNIT"]}
  clickedNodeID={selectedUnit}
  setClickedNodeID={handleUnitSelection}
  levels={2} // Show only 2 levels deep
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedDate` | `string` | ✅ | Current date for data comparison (ISO format) |
| `pastDate` | `string` | ✅ | Past date for historical comparison (ISO format) |
| `rootUnit` | `string` | ✅ | ID of the root organizational unit |
| `childUnits` | `string[]` | ✅ | Array of child unit IDs directly under root |
| `parallelUnits` | `string[]` | ✅ | Array of parallel unit IDs (same level as root) |
| `clickedNodeID` | `string` | ❌ | Currently selected node ID |
| `setClickedNodeID` | `function` | ✅ | Callback function for node selection |
| `levels` | `number` | ❌ | Maximum tree depth to display (default: 3) |

## Data Structure

The component expects data from a `DataContext` that provides:

### Current Units (`currentUnits`)
```javascript
[
  {
    unit_id: "UNIT_001",
    unit_name: "Alpha Company",
    parent_unit_id: "HQ_BATTALION",
    regular_soldiers: 45,
    officers: 8,
    senior_officers: 3,
    total_personnel: 56,
    date: "2024-01-15",
    roles: {
      "Type 1": [...], // Array of personnel
      "Type 2": [...],
      "Type 3": [...]
    },
    sub_units: [
      // Nested sub-units
    ]
  }
]
```

### Past Units (`pastUnits`)
Similar structure to `currentUnits` but for historical comparison data.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + +` or `Ctrl + =` | Zoom In |
| `Ctrl + -` | Zoom Out |
| `Ctrl + 0` | Reset Zoom |
| `F` | Toggle Full Screen |
| `Esc` | Exit Full Screen |

## Mouse Controls

| Action | Control |
|--------|---------|
| Zoom | `Ctrl + Mouse Wheel` |
| Pan | `Click + Drag` |
| Select Node | `Click on Node` |
| Reset View | `Click Reset Button` |

## Styling

The component uses CSS classes that can be customized:

```css
.org-chart-container { /* Main container */ }
.org-chart-container.fullscreen { /* Full screen mode */ }
.org-chart-header { /* Header with controls */ }
.org-chart-scroll-container { /* Scrollable area */ }
.org-chart-viewport { /* SVG viewport */ }
.org-chart-instructions { /* Help text */ }

/* D3 SVG Elements */
.tree-container { /* Main tree group */ }
.link { /* Connection lines */ }
.node { /* Individual nodes */ }
```

## Visual Indicators

### Node Border Colors
- **Blue**: Root unit
- **Purple**: Parallel units
- **Orange**: Selected node
- **Black**: Regular nodes

### Background Colors
- **Green Gradient**: Personnel increase
- **Red Gradient**: Personnel decrease  
- **White**: No change

### Growth Icons
- **↗️**: Increasing personnel
- **↘️**: Decreasing personnel
- **➖**: Stable personnel count

## Performance Considerations

- Tree rendering is optimized with D3.js for smooth interactions
- Depth limiting prevents performance issues with large hierarchies
-