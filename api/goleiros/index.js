import { query } from '../_db.js';

export default async function handler(req, res) {
  try {
    console.log('[API] goleiros GET request');
    console.log('[API] Environment:', {
      DB_HOST: process.env.DB_HOST ? '✓' : '✗',
      DB_USER: process.env.DB_USER ? '✓' : '✗',
      DB_PASS: process.env.DB_PASS ? '✓' : '✗',
      DB_NAME: process.env.DB_NAME ? '✓' : '✗'
    });

    if (req.method === 'GET') {
      const rows = await query('SELECT id, nomecompleto, whatsapp, cidade, tipo_campo, status, fotoperfil, rating FROM goleiros');
      console.log('[API] Query success, rows:', rows.length);
      return res.status(200).json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API] goleiros error:', err.message);
    return res.status(500).json({ error: 'DB error', details: err.message });
  }
}
