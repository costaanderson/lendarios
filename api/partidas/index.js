import { query } from '../_db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT id, data, hora, endereco, tipocampo, contratante, idgoleiro, status FROM partidas');
      return res.status(200).json(rows);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('partidas error', err);
    return res.status(500).json({ error: 'DB error', details: err.message });
  }
}
