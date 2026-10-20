import { getDatabase } from '../lib/mongodb.js';

const COUNTER_ID = 'site-wide';
function isReadOnlyRequest(req) {
  return req.method === 'GET' && (req.query?.count === '0' || String(req.url || '').includes('count=0'));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const collection = (await getDatabase()).collection('site_visits');
    let row;
    if (isReadOnlyRequest(req)) {
      row = await collection.findOne({ _id: COUNTER_ID });
    } else {
      const updated = await collection.findOneAndUpdate(
        { _id: COUNTER_ID },
        { $inc: { count: 1 }, $set: { updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );
      row = updated?.value ?? updated;
    }
    return res.status(200).json({ ok: true, visitors: Number(row?.count || 0) });
  } catch (error) {
    console.error('visitor counter failed', error?.name || 'DatabaseError');
    return res.status(503).json({ ok: false, error: 'Visitor count is temporarily unavailable.' });
  }
}
