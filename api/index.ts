import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'encrypted-api-production.cplplylv4i5w.eu-central-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sharks',
  user: process.env.DB_USER || 'dbmaster',
  password: process.env.DB_PASSWORD || 'rrfPMUriOKtsBkweJm21',
  ssl: { rejectUnauthorized: false }
});

interface Robot {
  uid: string;
  name: string;
  board: string;
  is_active: boolean;
  last_seen: string | null;
  operating_hours: number | null;
  latitude: number | null;
  longitude: number | null;
  battery: string | null;
  robot_state: any;
}

interface EnvironmentalData {
  robot_uid_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  temperature: number | null;
  pH: number | null;
  turbidity: number | null;
  DOmgL: number | null;
  conductivity: number | null;
}

interface FleetStats {
  total_robots: number;
  active_robots: number;
  online_24h: number;
  total_env_readings: number;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    if (path === '/api/stats') {
      const result = await pool.query<FleetStats>(`
        SELECT
          (SELECT COUNT(*) FROM robots_robot) as total_robots,
          (SELECT COUNT(*) FROM robots_robot WHERE is_active = true) as active_robots,
          (SELECT COUNT(*) FROM robots_robot WHERE last_seen > NOW() - INTERVAL '24 hours') as online_24h,
          (SELECT COUNT(*) FROM robots_environmentdata) as total_env_readings
      `);
      return new Response(JSON.stringify(result.rows[0]), { headers });
    }

    if (path === '/api/robots') {
      const result = await pool.query<Robot>(`
        SELECT uid, name, board, is_active, last_seen, operating_hours,
               latitude, longitude, battery, robot_state
        FROM robots_robot
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY last_seen DESC NULLS LAST
      `);
      return new Response(JSON.stringify(result.rows), { headers });
    }

    if (path.startsWith('/api/environmental/')) {
      const robotUid = path.split('/').pop();
      const result = await pool.query<EnvironmentalData>(`
        SELECT robot_uid_id, timestamp, latitude, longitude,
               temperature, "pH", turbidity, "DOmgL", conductivity
        FROM robots_environmentdata
        WHERE robot_uid_id = $1
        ORDER BY timestamp DESC
        LIMIT 100
      `, [robotUid]);
      return new Response(JSON.stringify(result.rows), { headers });
    }

    if (path === '/api/environmental/recent') {
      const result = await pool.query<EnvironmentalData>(`
        SELECT DISTINCT ON (robot_uid_id)
               robot_uid_id, timestamp, latitude, longitude,
               temperature, "pH", turbidity, "DOmgL", conductivity
        FROM robots_environmentdata
        ORDER BY robot_uid_id, timestamp DESC
      `);
      return new Response(JSON.stringify(result.rows), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (error: any) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
}
