#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function updateSchema() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('Adding missing columns to tournaments table...');
    await client.query(`
      ALTER TABLE tournaments 
      ADD COLUMN IF NOT EXISTS gdrive_original_folder_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gdrive_edited_folder_id VARCHAR(255);
    `);
    console.log('✅ Columns added successfully');

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

updateSchema();
