#!/usr/bin/env node

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkUsersTable() {
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

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log('Users table exists:', tableExists);

    if (tableExists) {
      // Check if admin user exists
      const userCheck = await client.query(`
        SELECT id, email, role FROM users WHERE email = 'admin@example.com';
      `);

      if (userCheck.rows.length > 0) {
        console.log('Admin user found:', userCheck.rows[0]);
      } else {
        console.log('❌ Admin user not found');

        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const insertResult = await client.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
          ['admin@example.com', hashedPassword, 'admin']
        );

        console.log('✅ Admin user created:', insertResult.rows[0]);
      }
    } else {
      console.log('❌ Users table does not exist');
    }

    // Close connection
    await client.end();
    console.log('Connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkUsersTable();