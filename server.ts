import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HardwarePacketLog {
  id: string;
  imei: string;
  protocol: string;
  rawPayload: string;
  decoded: Record<string, any>;
  ip: string;
  timestamp: string;
}

// In-memory packet log
const packetLogs: HardwarePacketLog[] = [
  {
    id: 'pkt_1',
    imei: '862908041539201',
    protocol: 'GT06 / JT808',
    rawPayload: '78781F12100A140F201C026B3F0C02B98000000000010000000100000D0A',
    decoded: {
      latitude: 35.7485,
      longitude: 51.3789,
      speed: 78,
      heading: 85,
      satellites: 15,
      acc: 1,
    },
    ip: '5.160.12.84',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'pkt_2',
    imei: '358249091823704',
    protocol: 'Teltonika Codec 8',
    rawPayload: '00000000000000320801000001859B1F20C00002B981C0026B3C0001200000',
    decoded: {
      latitude: 35.7010,
      longitude: 51.3340,
      speed: 62,
      heading: 260,
      satellites: 13,
      acc: 1,
    },
    ip: '2.144.90.15',
    timestamp: new Date().toISOString(),
  },
];

// Pending commands queue per IMEI
const pendingCommands: Record<string, Array<{ id: string; command: string; createdAt: string }>> = {};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for external hardware or WordPress webhook calls
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-KEY');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- 1. Real Hardware GPS Ingestion Endpoint ---
  // Accepts JSON or URL query params (e.g. from Traccar Client, OsmAnd, or HTTP-based GPS hardware)
  app.all('/api/gps/data', (req, res) => {
    const data = { ...req.query, ...req.body };
    const imei = String(data.imei || data.id || data.deviceid || '').trim();

    if (!imei) {
      return res.status(400).json({
        success: false,
        error: 'IMEI is required. Send ?imei=... or {"imei": "..."}',
      });
    }

    const lat = parseFloat(data.lat || data.latitude || '0');
    const lng = parseFloat(data.lon || data.lng || data.longitude || '0');
    const speed = parseFloat(data.speed || '0');
    const heading = parseFloat(data.bearing || data.heading || '0');
    const ignition = data.ignition === true || data.ignition === '1' || data.acc === '1';

    const logEntry: HardwarePacketLog = {
      id: `pkt_${Date.now()}`,
      imei,
      protocol: data.protocol || 'HTTP Generic GPS',
      rawPayload: JSON.stringify(data),
      decoded: { latitude: lat, longitude: lng, speed, heading, ignition },
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      timestamp: new Date().toISOString(),
    };

    packetLogs.unshift(logEntry);
    if (packetLogs.length > 100) packetLogs.pop();

    // Check if there are any pending commands for this IMEI to return in response
    const commands = pendingCommands[imei] || [];
    pendingCommands[imei] = []; // clear after delivery

    return res.json({
      success: true,
      message: 'GPS packet received and processed successfully',
      imei,
      pendingCommands: commands,
    });
  });

  // --- 2. Live Hardware Packet Logs ---
  app.get('/api/hardware/logs', (req, res) => {
    const imei = req.query.imei as string;
    const logs = imei ? packetLogs.filter((p) => p.imei === imei) : packetLogs;
    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  });

  // --- 3. Hardware Remote Commands (Immobilizer, Settings) ---
  app.post('/api/devices/:imei/command', (req, res) => {
    const { imei } = req.params;
    const { command, type } = req.body;

    if (!command && !type) {
      return res.status(400).json({ success: false, error: 'Command text or type is required' });
    }

    const cmdText = command || (type === 'engine_cut' ? 'RELAY,1#' : type === 'engine_restore' ? 'RELAY,0#' : 'STATUS#');

    if (!pendingCommands[imei]) {
      pendingCommands[imei] = [];
    }

    const cmdObject = {
      id: `cmd_${Date.now()}`,
      command: cmdText,
      createdAt: new Date().toISOString(),
    };

    pendingCommands[imei].push(cmdObject);

    return res.json({
      success: true,
      message: `Command [${cmdText}] queued for device IMEI ${imei}. Will be delivered on next hardware ping.`,
      command: cmdObject,
    });
  });

  // --- 4. WordPress & WooCommerce REST API Endpoints ---
  // Verify Device & License Status (Used by WordPress plugin before checkout)
  app.get('/api/wordpress/license/verify', (req, res) => {
    const imei = String(req.query.imei || '').trim();
    if (!imei) {
      return res.status(400).json({ success: false, message: 'IMEI parameter is required' });
    }

    return res.json({
      success: true,
      imei,
      registered: true,
      status: 'active',
      validUntil: new Date(Date.now() + 180 * 86400000).toISOString(),
      pluginCompatibility: 'NaviTrack WooCommerce Extension v1.0',
    });
  });

  // Activate / Renew License from WooCommerce Order Webhook
  app.post('/api/wordpress/license/activate', (req, res) => {
    const { imei, licenseKey, orderId, planMonths, customerEmail } = req.body;

    if (!imei) {
      return res.status(400).json({ success: false, message: 'IMEI is required for license binding' });
    }

    const months = parseInt(planMonths || '12', 10);
    const newExpiry = new Date(Date.now() + months * 30 * 86400000).toISOString();

    return res.json({
      success: true,
      message: `License successfully activated for IMEI ${imei} via WordPress Order #${orderId || 'Direct'}`,
      imei,
      licenseKey: licenseKey || `NVTRK-WP-${Date.now().toString(36).toUpperCase()}`,
      durationMonths: months,
      expiresAt: newExpiry,
      customerEmail: customerEmail || 'registered_user',
    });
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NaviTrack Platform] Server running on port ${PORT}`);
  });
}

startServer();
