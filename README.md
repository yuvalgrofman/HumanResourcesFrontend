# Army HR Visualization Tool

A web-based visualization tool for understanding the hierarchical structure and personnel distribution of military units.

## Project Overview

The Army HR Visualization Tool is designed to provide a clear and intuitive interface for exploring and analyzing military organizational structures. It displays unit hierarchies and personnel distributions, helping users understand the composition of different units and their relationships.

### Key Features:

- **Hierarchical Visualization**: View the entire organizational structure or focus on specific units
- **Personnel Distribution Analysis**: Track regular soldiers, officers, and senior officers across units
- **Temporal Analysis**: View and compare organization structure and personnel counts across different dates
- **Interactive Navigation**: Explore relationships between units with intuitive UI

## Technical Components

### Frontend:
- **React**: Component-based UI library for building the interface
- **React Router**: For navigation between different views
- **Axios**: For making API requests to the backend
- **CSS**: Custom styling for all components

### Backend (Existing):
- **FastAPI**: Python-based API framework
- **SQLite**: Database for storing unit and personnel data

## Project Structure

```
army-hr-visualization/
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # Reusable UI components
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── OrgChart.js  # Placeholder for the org chart visualization
│   │   ├── UnitCard.js
│   │   └── DateSelector.js
│   ├── services/
│   │   └── api.js      # API communication layer
│   ├── contexts/
│   │   └── DataContext.js  # State management
│   ├── pages/
│   │   ├── Dashboard.js
│   │   └── UnitDetails.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to the backend API (FastAPI server)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/army-hr-visualization.git
   cd army-hr-visualization
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure backend connection:
   - The project is pre-configured to connect to a backend at `http://localhost:8000`
   - If your backend is running at a different URL, update the `proxy` field in `package.json`

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Running the Backend

This project requires the Army HR Database Manager Backend to be running. Follow these steps:

1. Make sure Python 3.8+ is installed
2. Clone the backend repository
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic requests
   ```
4. Start the backend server:
   ```bash
   python main.py
   ```
5. The API should now be accessible at http://localhost:8000/api/

## Next Steps

This project currently provides the framework for the visualization tool with placeholder components for the organizational chart. The next phase of development will involve:

1. Implementing the actual organizational chart visualization
2. Adding filtering capabilities
3. Enhancing the UI with more interactive features
4. Adding time-series comparison views
5. Implementing unit-level analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.