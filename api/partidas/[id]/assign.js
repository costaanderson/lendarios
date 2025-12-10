import { query } from '../../_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const id = parseInt(req.query.id || req.url.split('/').pop(), 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const goleiroId = parseInt(body.goleiroId, 10);
    if (!goleiroId) return res.status(400).json({ error: 'Invalid goleiroId' });

    await query('UPDATE partidas SET idgoleiro = ?, status = ? WHERE id = ?', [goleiroId, 'confirmado', id]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('assign partida error', err);
    return res.status(500).json({ error: 'DB error', details: err.message });
  }
}
