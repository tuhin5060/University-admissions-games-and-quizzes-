import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/mongodb.js';

const MAX_QUESTIONS = 30;
const MAX_POINTS_PER_QUESTION = 40;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value, max) {
  return String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}
function boundedInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) return JSON.parse(req.body);
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  try {
    const db = await getDatabase();
    const attempts = db.collection('scoreAttempts');

    if (req.method === 'GET') {
      const rows = await attempts.aggregate([
        { $match: { playerId: { $type: 'string' }, name: { $type: 'string' }, score: { $type: 'number' }, topic: { $type: 'string' } } },
        { $sort: { score: -1, correct: -1, timeSec: 1, at: 1 } },
        { $group: { _id: { playerId: '$playerId', topic: '$topic' }, best: { $first: '$$ROOT' }, attempts: { $sum: 1 } } },
        { $replaceRoot: { newRoot: { $mergeObjects: ['$best', { attempts: '$attempts' }] } } },
        { $project: { _id: 0, playerId: 1, name: 1, avatar: 1, topic: 1, mode: 1, score: 1, correct: 1, total: 1, bestStreak: 1, timeSec: 1, at: 1, attempts: 1 } },
        { $sort: { score: -1, correct: -1, timeSec: 1 } },
        { $limit: 100 }
      ]).toArray();
      return res.status(200).json({ ok: true, database: 'mongodb', rows });
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const playerId = String(body.playerId || '');
      if (!ID_RE.test(playerId)) {
        return res.status(400).json({ ok: false, error: 'Register a student name before submitting a score.' });
      }
      const student = await db.collection('students').findOne({ _id: playerId });
      if (!student) return res.status(401).json({ ok: false, error: 'Student profile not found. Please save your name and try again.' });

      const totalValue = Number(body.total);
      if (!Number.isInteger(totalValue) || totalValue < 1 || totalValue > MAX_QUESTIONS) {
        return res.status(400).json({ ok: false, error: `Question total must be between 1 and ${MAX_QUESTIONS}.` });
      }
      const correctValue = Number(body.correct);
      if (!Number.isInteger(correctValue) || correctValue < 0 || correctValue > totalValue) {
        return res.status(400).json({ ok: false, error: 'Invalid correct-answer count.' });
      }

      const attemptId = clean(body.attemptId, 100) || randomUUID();
      const existing = await attempts.findOne({ attemptId });
      if (existing) {
        if (existing.playerId !== playerId) return res.status(409).json({ ok: false, error: 'This submission ID has already been used.' });
        const { _id, ...entry } = existing;
        return res.status(200).json({ ok: true, duplicate: true, entry });
      }

      const entry = {
        attemptId,
        playerId,
        name: student.name,
        avatar: student.avatar || '🚂',
        topic: clean(body.topic, 50) || 'Mixed English',
        mode: ['fun', 'test'].includes(body.mode) ? body.mode : 'test',
        score: boundedInt(body.score, 0, totalValue * MAX_POINTS_PER_QUESTION),
        correct: correctValue,
        total: totalValue,
        bestStreak: boundedInt(body.bestStreak, 0, totalValue),
        timeSec: boundedInt(body.timeSec, 0, 36000),
        at: new Date().toISOString()
      };
      await attempts.insertOne(entry);
      await db.collection('students').updateOne({ _id: playerId }, { $set: { lastSeenAt: new Date() } });
      return res.status(201).json({ ok: true, database: 'mongodb', entry });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('leaderboard API failed', error?.name || 'DatabaseError');
    return res.status(500).json({ ok: false, error: 'Could not read or save the leaderboard right now.' });
  }
}