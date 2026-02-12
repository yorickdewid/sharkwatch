import { Pool } from 'pg';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const pool = new Pool({
  host: process.env.DB_HOST || 'encrypted-api-production.cplplylv4i5w.eu-central-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sharks',
  user: process.env.DB_USER || 'dbmaster',
  password: process.env.DB_PASSWORD || 'rrfPMUriOKtsBkweJm21',
  ssl: { rejectUnauthorized: false }
});

const DIST_DIR = join(process.cwd(), 'dist');

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  // CORS for API
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API routes
  if (url.pathname.startsWith('/api/')) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      if (url.pathname === '/api/stats') {
        const result = await pool.query(`
          SELECT
            (SELECT COUNT(*) FROM robots_robot) as total_robots,
            (SELECT COUNT(*) FROM robots_robot WHERE is_active = true) as active_robots,
            (SELECT COUNT(*) FROM robots_robot WHERE last_seen > NOW() - INTERVAL '24 hours') as online_24h,
            (SELECT COUNT(*) FROM robots_environmentdata) as total_env_readings
        `);
        res.writeHead(200, headers);
        res.end(JSON.stringify(result.rows[0]));
        return;
      }

      if (url.pathname === '/api/robots') {
        const result = await pool.query(`
          SELECT uid, name, board, is_active, last_seen, operating_hours,
                 latitude, longitude, battery, robot_state
          FROM robots_robot
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          ORDER BY last_seen DESC NULLS LAST
        `);
        res.writeHead(200, headers);
        res.end(JSON.stringify(result.rows));
        return;
      }

      if (url.pathname.startsWith('/api/environmental/')) {
        const robotUid = url.pathname.split('/').pop();
        const result = await pool.query(`
          SELECT robot_uid_id, timestamp, latitude, longitude,
                 temperature, "pH", turbidity, "DOmgL", conductivity
          FROM robots_environmentdata
          WHERE robot_uid_id = $1
          ORDER BY timestamp DESC
          LIMIT 100
        `, [robotUid]);
        res.writeHead(200, headers);
        res.end(JSON.stringify(result.rows));
        return;
      }

      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
    } catch (error: any) {
      console.error('API error:', error);
      res.writeHead(500, headers);
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Serve static files
  let filePath = join(DIST_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

  if (!existsSync(filePath) && !url.pathname.includes('.')) {
    filePath = join(DIST_DIR, 'index.html');
  }

  if (existsSync(filePath)) {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SharkWatch running on port ${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
});
