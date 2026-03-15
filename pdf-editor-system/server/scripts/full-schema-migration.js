#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function fullSchemaMigration() {
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

    // 1. Update tournaments table
    console.log('Updating tournaments table...');
    await client.query(`
      ALTER TABLE tournaments 
      ADD COLUMN IF NOT EXISTS gdrive_original_folder_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gdrive_edited_folder_id VARCHAR(255);
    `);

    // 2. Update templates table
    console.log('Updating templates table...');
    // We'll add missing columns. Some might already exist.
    const columnsToAdd = [
      { name: 'title', type: 'VARCHAR(255)' },
      { name: 'subtitle', type: 'TEXT' },
      { name: 'venue', type: 'VARCHAR(255)' },
      { name: 'dates', type: 'VARCHAR(255)' },
      { name: 'left_logo_url', type: 'TEXT' },
      { name: 'right_logo_url', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
      await client.query(`
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
      `);
    }

    // 3. Create files table if it doesnt exist
    console.log('Ensuring files table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id),
        file_name VARCHAR(255) NOT NULL,
        original_file_url TEXT,
        edited_file_url TEXT,
        status VARCHAR(50) DEFAULT 'uploaded',
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Note: I changed uploaded_by from UUID to INTEGER to match the current users table.

    console.log('✅ Schema migration completed successfully');

    await client.end();
  } catch (err) {
    console.error('❌ Error during migration:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

fullSchemaMigration();
