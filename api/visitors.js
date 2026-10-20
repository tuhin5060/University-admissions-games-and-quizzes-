import { getDatabase } from '../lib/mongodb.js';

const ACTIVE_WINDOW_MS = 90_000;
const SESSION_RE = /^[a-zA-Z0-9_-]{16,100}$/;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch {} }
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const collection = (await getDatabase()).collection('online_visitors');
    const now = new Date();
    if (req.method === 'POST') {
      const sessionId = String(readBody(req).sessionId || '');
      if (!SESSION_RE.test(sessionId)) return res.status(400).json({ ok: false, error: 'Invalid browser session' });
      await collection.updateOne(
        { _id: sessionId },
        { $set: { lastSeen: now } },
        { upsert: true }
      );
    }
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const visitors = await collection.countDocuments({ lastSeen: { $gte: cutoff } });
    return res.status(200).json({ ok: true, onlineNow: visitors, activeWithinSeconds: 90 });
  } catch (error) {
    console.error('online visitor presence failed', error?.name || 'DatabaseError');
    return res.status(503).json({ ok: false, error: 'Live presence temporarily unavailable.' });
  }
}
