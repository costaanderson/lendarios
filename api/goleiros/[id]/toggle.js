import { query } from '../../_db';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const id = parseInt(req.query.id || req.url.split('/').pop(), 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    // Alterna status: se status for 1 torna 0, se 0 torna 1
    await query('UPDATE goleiros SET status = NOT status WHERE id = ?', [id]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('toggle goleiro error', err);
    return res.status(500).json({ error: 'DB error', details: err.message });
  }
}
