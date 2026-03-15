#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function addGoogleDriveUrlToFileTable() {
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

    console.log('Adding google_drive_url column to files table...');
    await client.query(`
      ALTER TABLE files 
      ADD COLUMN IF NOT EXISTS google_drive_url TEXT;
    `);
    console.log('✅ Column added successfully');

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

addGoogleDriveUrlToFileTable();
