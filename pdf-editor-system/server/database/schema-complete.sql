-- Database Schema for Tournament PDF Header Automation System

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
    gdrive_original_folder_id VARCHAR(255),
    gdrive_edited_folder_id VARCHAR(255),
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
    gdrive_template_file_id VARCHAR(255),
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
CREATE INDEX IF NOT EXISTS idx_pdf_files_uploaded_by ON pdf_files(uploaded_by);