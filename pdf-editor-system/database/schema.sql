-- Database: PostgreSQL
-- Name: tournament_pdf_system

-- Drop existing tables if they exist
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments Table
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id),
    gdrive_folder_id VARCHAR(255),
    gdrive_original_folder_id VARCHAR(255),
    gdrive_edited_folder_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates Table
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    venue VARCHAR(255),
    dates VARCHAR(255),
    left_logo_url TEXT,
    right_logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files Table
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id),
    file_name VARCHAR(255) NOT NULL,
    original_file_url TEXT,
    edited_file_url TEXT,
    status VARCHAR(50) DEFAULT 'uploaded',
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO users (email, password_hash, role) VALUES
('admin@example.com', 'hashed_password_here', 'admin'),
('editor@example.com', 'hashed_password_here', 'editor');

INSERT INTO tournaments (name, created_by) VALUES
('Rana Sanga 2026', (SELECT id FROM users WHERE email = 'admin@example.com')),
('Junior Nationals', (SELECT id FROM users WHERE email = 'admin@example.com'));

INSERT INTO templates (name, title, subtitle, venue, dates) VALUES
('Score Sheet', 'Boxing Tournament', 'Score Sheet Template', 'Sports Arena', 'March 15-17, 2026'),
('Daily Program', 'Boxing Tournament', 'Daily Program Template', 'Sports Arena', 'March 15-17, 2026');