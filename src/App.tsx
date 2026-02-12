import { useEffect, useState } from 'react';
import './App.css';
import FleetMap from './components/FleetMap';
import StatsPanel from './components/StatsPanel';
import RobotList from './components/RobotList';
import EnvironmentalChart from './components/EnvironmentalChart';

interface Robot {
  uid: string;
  name: string;
  board: string;
  is_active: boolean;
  last_seen: string | null;
  latitude: number;
  longitude: number;
  battery: string | null;
  robot_state: any;
}

interface FleetStats {
  total_robots: number;
  active_robots: number;
  online_24h: number;
  total_env_readings: number;
}

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

function App() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [robotsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/robots`),
          fetch(`${API_BASE}/stats`)
        ]);

        setRobots(await robotsRes.json());
        setStats(await statsRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading SharkWatch Fleet Monitor...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🦈 SharkWatch Fleet Monitor</h1>
        <p className="subtitle">Real-time monitoring of RanMarine autonomous cleanup robots</p>
      </header>

      {stats && <StatsPanel stats={stats} />}

      <div className="main-content">
        <div className="map-section">
          <FleetMap
            robots={robots}
            selectedRobot={selectedRobot}
            onSelectRobot={setSelectedRobot}
          />
        </div>

        <div className="sidebar">
          <RobotList
            robots={robots}
            selectedRobot={selectedRobot}
            onSelectRobot={setSelectedRobot}
          />
        </div>
      </div>

      {selectedRobot && (
        <div className="chart-section">
          <EnvironmentalChart
            robotUid={selectedRobot}
            onClose={() => setSelectedRobot(null)}
          />
        </div>
      )}

      <footer className="footer">
        <p>SharkWatch v1.0 | Data from RanMarine PostgreSQL Database</p>
        <p className="tech-stack">Built with React + TypeScript + Leaflet + Recharts</p>
      </footer>
    </div>
  );
}

export default App;
