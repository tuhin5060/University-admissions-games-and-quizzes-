import { put, list, get } from '@vercel/blob';

const TOTAL = 20;
const MAX_SCORE = TOTAL * 40;

function clean(v, max) {
  return String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

async function readAll() {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: 'scores/', cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);

  const rows = await Promise.all(
    blobs.map(async b => {
      try {
        // This store is private: use the SDK read path, never a public Blob URL.
        const result = await get(b.pathname, { access: 'private' });
        if (!result || result.statusCode !== 200 || !result.stream) return null;
        const raw = await new Response(result.stream).text();
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
  );
  return rows.filter(Boolean);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const rows = await readAll();
      return res.status(200).json({ ok: true, rows });
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name = clean(b.name, 40);
      const roll = clean(b.roll, 20);
      if (name.length < 2 || !roll) {
        return res.status(400).json({ ok: false, error: 'Name and roll are required.' });
      }
      const num = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));
      const entry = {
        name,
        roll,
        avatar: clean(b.avatar, 8) || '🚂',
        score: num(b.score, 0, MAX_SCORE),
        correct: num(b.correct, 0, TOTAL),
        total: TOTAL,
        bestStreak: num(b.bestStreak, 0, TOTAL),
        timeSec: num(b.timeSec, 0, 36000),
        at: new Date().toISOString()
      };
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await put(`scores/${id}.json`, JSON.stringify(entry), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false
      });
      return res.status(200).json({ ok: true, entry });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message || err) });
  }
}