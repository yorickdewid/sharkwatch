interface FleetStats {
  total_robots: number;
  active_robots: number;
  online_24h: number;
  total_env_readings: number;
}

interface Props {
  stats: FleetStats;
}

export default function StatsPanel({ stats }: Props) {
  return (
    <div className="stats-panel">
      <div className="stat-card">
        <div className="stat-value">{stats.total_robots}</div>
        <div className="stat-label">Total Robots</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.active_robots}</div>
        <div className="stat-label">Active</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.online_24h}</div>
        <div className="stat-label">Online (24h)</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{(stats.total_env_readings / 1000).toFixed(0)}K</div>
        <div className="stat-label">Sensor Readings</div>
      </div>
    </div>
  );
}
