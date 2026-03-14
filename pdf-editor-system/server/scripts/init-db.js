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
    ssl: {
      rejectUnauthorized: false // Accept self-signed certificates for testing
    }
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

// Create database directory and schema file if they don't exist
async function setupDatabaseSchema() {
  const databaseDir = path.join(__dirname, '..', 'database');
  const schemaPath = path.join(databaseDir, 'schema.sql');

  try {
    // Create database directory if it doesn't exist
    await fs.mkdir(databaseDir, { recursive: true });

    // Check if schema file exists
    try {
      await fs.access(schemaPath);
      console.log('Database schema file already exists');
    } catch (err) {
      // Schema file doesn't exist, create it
      const schemaContent = `-- Database Schema for Tournament PDF Header Automation System

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE,
    location VARCHAR(255),
    gdrive_folder_id VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    fields JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pdf_files table
CREATE TABLE IF NOT EXISTS pdf_files (
    id SERIAL PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password is 'admin123')
INSERT INTO users (email, password_hash, role) VALUES
('admin@example.com', '$2a$10$8K1p/a0dURXAm7QiTRqNa.E3S5c7S8W7WHluSB2.bMi6C.q/OE0Ly', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_pdf_files_tournament_id ON pdf_files(tournament_id);
CREATE INDEX IF NOT EXISTS idx_pdf_files_uploaded_by ON pdf_files(uploaded_by);`;

      await fs.writeFile(schemaPath, schemaContent);
      console.log('Database schema file created successfully');
    }
  } catch (err) {
    console.error('Error setting up database schema:', err);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabaseSchema().then(() => {
    initializeDatabase();
  });
}

initializeDatabase();