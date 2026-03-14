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

    // Add all missing columns to tournaments table
    console.log('\n=== Updating tournaments table ===');
    const tournamentColumns = [
      'gdrive_folder_id VARCHAR(255)',
      'gdrive_original_folder_id VARCHAR(255)',
      'gdrive_edited_folder_id VARCHAR(255)'
    ];

    for (const columnDef of tournamentColumns) {
      try {
        const columnName = columnDef.split(' ')[0];
        await client.query(`
          ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS ${columnDef};
        `);
        console.log(`✅ Added ${columnName} column to tournaments table`);
      } catch (err) {
        console.log(`ℹ️  Column might already exist or error:`, err.message);
      }
    }

    // Add all missing columns to templates table
    console.log('\n=== Updating templates table ===');
    const templateColumns = [
      'fields JSONB',
      'gdrive_template_file_id VARCHAR(255)'
    ];

    for (const columnDef of templateColumns) {
      try {
        const columnName = columnDef.split(' ')[0];
        await client.query(`
          ALTER TABLE templates ADD COLUMN IF NOT EXISTS ${columnDef};
        `);
        console.log(`✅ Added ${columnName} column to templates table`);
      } catch (err) {
        console.log(`ℹ️  Column might already exist or error:`, err.message);
      }
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