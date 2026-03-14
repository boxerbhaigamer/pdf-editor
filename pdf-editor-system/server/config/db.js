const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

console.log('Database configuration:');
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_PORT:', process.env.DB_PORT);

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tournament_pdf_system',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false // Accept self-signed certificates for Render
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};