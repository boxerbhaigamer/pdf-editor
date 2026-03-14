#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testConnection() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('Successfully connected to database');

    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);

    // Close connection
    await client.end();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error connecting to database:', err.message);
    await client.end();
    process.exit(1);
  }
}

testConnection();