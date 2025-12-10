import { query } from '../_db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT id, nomecompleto, whatsapp, cidade, tipo_campo, status, fotoperfil, rating FROM goleiros');
      return res.status(200).json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('goleiros error', err);
    return res.status(500).json({ error: 'DB error', details: err.message });
  }
}
