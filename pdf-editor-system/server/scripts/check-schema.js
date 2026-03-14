#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkDatabaseSchema() {
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

    // Check tournaments table structure
    console.log('\n=== Tournaments Table Structure ===');
    const tournamentsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      ORDER BY ordinal_position;
    `);

    console.table(tournamentsStructure.rows);

    // Check templates table structure
    console.log('\n=== Templates Table Structure ===');
    const templatesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'templates'
      ORDER BY ordinal_position;
    `);

    console.table(templatesStructure.rows);

    // Close connection
    await client.end();
    console.log('\nConnection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkDatabaseSchema();