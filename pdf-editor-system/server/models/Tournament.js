const db = require('../config/db');

class Tournament {
  static async create(tournamentData) {
    const { name, createdBy, gdriveFolderId, gdriveOriginalFolderId, gdriveEditedFolderId } = tournamentData;
    const query = `
      INSERT INTO tournaments (name, created_by, gdrive_folder_id, gdrive_original_folder_id, gdrive_edited_folder_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [name, createdBy, gdriveFolderId || null, gdriveOriginalFolderId || null, gdriveEditedFolderId || null];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT t.*, u.email as creator_email
      FROM tournaments t
      JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT t.*, u.email as creator_email
      FROM tournaments t
      JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, tournamentData) {
    const { name } = tournamentData;
    const query = `
      UPDATE tournaments
      SET name = $1
      WHERE id = $2
      RETURNING *
    `;
    const values = [name, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM tournaments WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Tournament;