#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tournament_pdf_system',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    // Execute schema
    await client.query(schemaSQL);
    console.log('Database initialized successfully');

    // Close connection
    await client.end();
  } catch (err) {
    console.error('Error initializing database:', err);
    await client.end();
    process.exit(1);
  }
}

initializeDatabase();