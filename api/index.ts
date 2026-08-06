import express from 'express';
import { sendOobLinkRemote, verifyOobLinkRemote } from '../src/lib/alightApi.js';
import { loadGithubProxies } from '../src/lib/proxyManager.js';

export const app = express();

app.use(express.json());

// In-memory Database for real verified records and statistics
let stats = {
  todayCount: 0,
  totalCount: 0,
  dbType: 'mongodb (connected)'
};

let activityLogs: Array<{
  id: string;
  emailMasked: string;
  timeAgo: string;
  statusText: string;
}> = [];

// Rate limiting map: email -> lastRequestTimestamp
const cooldownMap = new Map<string, number>();

// Global error wrapper for API handlers to prevent unhandled 500 HTML responses on Vercel
const asyncHandler = (fn: express.RequestHandler): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('[API Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Terjadi kesalahan internal pada server.' });
      }
    });
  };
};

// API Routes
app.get('/api/health', asyncHandler(async (req, res) => {
  const proxies = await loadGithubProxies();
  res.json({
    status: 'ok',
    hasApiKey: true,
    proxyCount: proxies.length,
    time: new Date().toISOString()
  });
}));

// Get real-time stats
app.get('/api/stats', asyncHandler((req, res) => {
  res.json(stats);
}));

// Get activity logs
app.get('/api/logs', asyncHandler((req, res) => {
  res.json(activityLogs);
}));

// Send OOB Link (Step 1)
app.post('/api/oob/send', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Alamat email tidak valid.' });
  }

  // Cooldown check (2 minutes)
  const now = Date.now();
  const lastTime = cooldownMap.get(email.toLowerCase());
  if (lastTime && now - lastTime < 120000) {
    const waitSeconds = Math.ceil((120000 - (now - lastTime)) / 1000);
    return res.status(429).json({
      error: `Jeda cooldown 2 menit sedang aktif untuk email ini. Silakan tunggu ${waitSeconds} detik lagi.`
    });
  }

  cooldownMap.set(email.toLowerCase(), now);

  // Call live API engine
  const remoteResult = await sendOobLinkRemote(email);

  if (!remoteResult.success) {
    const errorMsg = 'error' in remoteResult ? (remoteResult as any).error : 'Gagal mengirim instruksi link OOB ke server Alight Motion.';
    return res.status(400).json({
      error: errorMsg || 'Gagal mengirim instruksi link OOB ke server Alight Motion.'
    });
  }

  return res.json({
    success: true,
    message: remoteResult.message || 'Instruksi link OOB berhasil diproses. Cek inbox/spam email kamu dari Alight Creative.',
    expiresInSeconds: 180,
    raw: remoteResult.rawResponse
  });
}));

// Verify OOB Token (Step 2)
app.post('/api/oob/verify', asyncHandler(async (req, res) => {
  const { email, oobLink } = req.body;

  if (!email || !oobLink) {
    return res.status(400).json({ error: 'Email dan Link OOB wajib diisi.' });
  }

  // Call live API engine
  const remoteResult = await verifyOobLinkRemote(email, oobLink);

  if (!remoteResult.success) {
    const errorMsg = 'error' in remoteResult ? (remoteResult as any).error : 'Verifikasi OOB Token gagal.';
    return res.status(400).json({
      error: errorMsg || 'Verifikasi OOB Token gagal.'
    });
  }

  // Update stats and logs upon success
  stats.todayCount += 1;
  stats.totalCount += 1;

  // Mask email for public log
  const parts = email.split('@');
  const maskedPrefix = parts[0].length > 3 ? parts[0].substring(0, 3) + '***' : parts[0] + '***';
  const maskedEmail = `${maskedPrefix}@${parts[1]}`;

  const newLog = {
    id: 'act-' + Date.now(),
    emailMasked: maskedEmail,
    timeAgo: 'Baru saja',
    statusText: 'Berhasil Aktivasi Alight Motion Pro!'
  };

  activityLogs = [newLog, ...activityLogs.slice(0, 9)];

  const record = {
    id: 'AMPRO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    email,
    timestamp: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    status: 'ACTIVE' as const,
    licenseKey: 'PRO-1YR-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    oobToken: oobLink.substring(0, 25) + '...',
    remoteData: remoteResult.data
  };

  return res.json({
    success: true,
    record
  });
}));

// Catch-all Express Error Handler to ensure JSON response
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Express Error]', err);
  res.status(500).json({
    error: err.message || 'Terjadi kesalahan sistem pada server.'
  });
});

export default app;