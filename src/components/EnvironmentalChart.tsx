import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EnvironmentalData {
  robot_uid_id: string;
  timestamp: string;
  temperature: number | null;
  pH: number | null;
  turbidity: number | null;
  DOmgL: number | null;
  conductivity: number | null;
}

interface Props {
  robotUid: string;
}

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export default function EnvironmentalChart({ robotUid }: Props) {
  const [data, setData] = useState<EnvironmentalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/environmental/${robotUid}`);
        const envData = await res.json();
        setData(envData.reverse());
      } catch (error) {
        console.error('Failed to fetch environmental data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [robotUid]);

  if (loading) {
    return <div className="loading-chart">Loading environmental data...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="no-data-chart">
        No environmental sensor data available for this robot.
      </div>
    );
  }

  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleString(),
    temperature: d.temperature,
    pH: d.pH,
    turbidity: d.turbidity,
    DO: d.DOmgL,
    conductivity: d.conductivity ? d.conductivity / 100 : null // Scale down for readability
  }));

  return (
    <div className="environmental-charts">
      <h3>Environmental Sensor Data - Robot {robotUid}</h3>
      <div className="charts-grid">
        {data.some(d => d.temperature !== null) && (
          <div className="chart">
            <h4>Temperature (°C)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={false} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#ff7300" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.some(d => d.pH !== null) && (
          <div className="chart">
            <h4>pH Level</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={false} />
                <YAxis domain={[0, 14]} />
                <Tooltip />
                <Line type="monotone" dataKey="pH" stroke="#387908" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.some(d => d.turbidity !== null) && (
          <div className="chart">
            <h4>Turbidity (NTU)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={false} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="turbidity" stroke="#8b4513" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.some(d => d.DOmgL !== null) && (
          <div className="chart">
            <h4>Dissolved Oxygen (mg/L)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={false} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="DO" stroke="#1e90ff" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
