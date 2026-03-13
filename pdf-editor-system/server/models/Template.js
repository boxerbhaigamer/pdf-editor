const db = require('../config/db');

class Template {
  static async create(templateData) {
    const { name, title, subtitle, venue, dates, leftLogoUrl, rightLogoUrl } = templateData;
    const query = `
      INSERT INTO templates (name, title, subtitle, venue, dates, left_logo_url, right_logo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, title, subtitle, venue, dates, leftLogoUrl, rightLogoUrl];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM templates ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM templates WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, templateData) {
    const { name, title, subtitle, venue, dates, leftLogoUrl, rightLogoUrl } = templateData;
    const query = `
      UPDATE templates
      SET name = $1, title = $2, subtitle = $3, venue = $4, dates = $5, left_logo_url = $6, right_logo_url = $7
      WHERE id = $8
      RETURNING *
    `;
    const values = [name, title, subtitle, venue, dates, leftLogoUrl, rightLogoUrl, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM templates WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Template;