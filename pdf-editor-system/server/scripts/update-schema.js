#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function updateDatabaseSchema() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false // Accept self-signed certificates for testing
    }
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // Add gdrive_folder_id column to tournaments table if it doesn't exist
    console.log('\n=== Updating tournaments table ===');
    try {
      await client.query(`
        ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS gdrive_folder_id VARCHAR(255);
      `);
      console.log('✅ Added gdrive_folder_id column to tournaments table');
    } catch (err) {
      console.log('ℹ️  gdrive_folder_id column already exists or error:', err.message);
    }

    // Add fields column to templates table if it doesn't exist
    console.log('\n=== Updating templates table ===');
    try {
      await client.query(`
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS fields JSONB;
      `);
      console.log('✅ Added fields column to templates table');
    } catch (err) {
      console.log('ℹ️  fields column already exists or error:', err.message);
    }

    // Close connection
    await client.end();
    console.log('\n✅ Database schema update completed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

updateDatabaseSchema();