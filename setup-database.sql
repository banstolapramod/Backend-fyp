-- PostgreSQL Database Setup for Sneakers Spot
-- Run this script to create the database and user

-- Create database (run as postgres superuser)
CREATE DATABASE "SneakersSpot";

-- Create user (optional - you can use existing postgres user)
-- CREATE USER sneakers_user WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON DATABASE "SneakersSpot" TO sneakers_user;

-- Connect to SneakersSpot database and create tables
\c "SneakersSpot";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default users (passwords are hashed version of 'password')
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@sneakersspot.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Vendor User', 'vendor@sneakersspot.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendor'),
('Customer User', 'customer@sneakersspot.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Display created tables
\dt

-- Display users
SELECT user_id, name, email, role, created_at FROM users;