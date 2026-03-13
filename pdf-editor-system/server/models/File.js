const db = require('../config/db');

class File {
  static async create(fileData) {
    const { tournamentId, fileName, originalFileUrl, editedFileUrl, status, uploadedBy } = fileData;
    const query = `
      INSERT INTO files (tournament_id, file_name, original_file_url, edited_file_url, status, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [tournamentId, fileName, originalFileUrl, editedFileUrl, status, uploadedBy];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAllByTournamentId(tournamentId) {
    const query = `
      SELECT f.*, u.email as uploader_email
      FROM files f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.tournament_id = $1
      ORDER BY f.created_at DESC
    `;
    const result = await db.query(query, [tournamentId]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT f.*, u.email as uploader_email
      FROM files f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, fileData) {
    const { fileName, originalFileUrl, editedFileUrl, status } = fileData;
    const query = `
      UPDATE files
      SET file_name = $1, original_file_url = $2, edited_file_url = $3, status = $4
      WHERE id = $5
      RETURNING *
    `;
    const values = [fileName, originalFileUrl, editedFileUrl, status, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM files WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = File;