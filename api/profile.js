import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/mongodb.js';

const COOKIE = 'campus_player';
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_AVATARS = new Set(['🚂','🦁','🐯','🐼','🦊','🐸','🐵','🦄','🐧','🐙','🐨','🤖']);

function clean(value, max) {
  return String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) return JSON.parse(req.body);
  return {};
}
function getCookie(req) {
  const header = req.headers?.cookie || req.headers?.Cookie || '';
  const part = String(header).split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  try { return part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : ''; } catch { return ''; }
}
function setCookie(res, playerId) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(playerId)}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`);
}
function view(student) {
  if (!student) return null;
  return {
    playerId: String(student._id),
    name: student.name,
    avatar: student.avatar || '🚂',
    createdAt: student.createdAt instanceof Date ? student.createdAt.toISOString() : student.createdAt,
    updatedAt: student.updatedAt instanceof Date ? student.updatedAt.toISOString() : student.updatedAt
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  try {
    const db = await getDatabase();
    const students = db.collection('students');

    if (req.method === 'GET') {
      const requested = String(req.query?.playerId || '');
      const fromCookie = getCookie(req);
      const playerId = ID_RE.test(requested) ? requested : fromCookie;
      if (!ID_RE.test(playerId)) return res.status(200).json({ ok: true, player: null });
      const student = await students.findOne({ _id: playerId });
      if (!student) return res.status(200).json({ ok: true, player: null });
      await students.updateOne({ _id: playerId }, { $set: { lastSeenAt: new Date() } });
      setCookie(res, playerId);
      return res.status(200).json({ ok: true, player: view(student) });
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const name = clean(body.name, 60);
      const avatar = ALLOWED_AVATARS.has(body.avatar) ? body.avatar : '🚂';
      const requested = String(body.playerId || '');
      const cookieId = getCookie(req);
      const playerId = ID_RE.test(requested) ? requested : (ID_RE.test(cookieId) ? cookieId : '');
      if (name.length < 2) {
        return res.status(400).json({ ok: false, error: 'Enter your full name (at least 2 characters).' });
      }

      const now = new Date();
      let student = playerId ? await students.findOne({ _id: playerId }) : null;
      if (student) {
        await students.updateOne({ _id: playerId }, { $set: { name, avatar, updatedAt: now, lastSeenAt: now } });
        student = await students.findOne({ _id: playerId });
      } else {
        const id = randomUUID();
        student = { _id: id, name, avatar, createdAt: now, updatedAt: now, lastSeenAt: now };
        await students.insertOne(student);
      }
      const result = view(student);
      setCookie(res, result.playerId);
      return res.status(201).json({ ok: true, player: result });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('student profile API failed', error?.name || 'DatabaseError');
    return res.status(500).json({ ok: false, error: 'Could not load or save your student profile right now.' });
  }
}