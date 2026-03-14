#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('Testing database connection with settings:');
  console.log('- Host:', process.env.DB_HOST);
  console.log('- Port:', process.env.DB_PORT);
  console.log('- Database:', process.env.DB_NAME);
  console.log('- User:', process.env.DB_USER);

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
    console.log('Attempting to connect...');
    // Connect to database
    await client.connect();
    console.log('✅ Successfully connected to database');

    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);

    // Close connection
    await client.end();
    console.log('Connection closed');
  } catch (err) {
    console.error('❌ Error connecting to database:', err.message);
    console.error('Error code:', err.code);
    if (err.detail) console.error('Detail:', err.detail);
    await client.end().catch(() => {}); // Ignore errors when closing
    process.exit(1);
  }
}

testConnection();