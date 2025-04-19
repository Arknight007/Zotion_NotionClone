-- Create database (will be created by application if it doesn't exist)
CREATE DATABASE IF NOT EXISTS zotion;
USE zotion;

-- Drop tables if they exist to ensure clean installation
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create collections table
CREATE TABLE collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create notes table
CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  template VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  collection_id INT NULL,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add sample user (password: password123)
INSERT INTO users (name, email, password) VALUES 
('Test User', 'test@example.com', 'password123');

-- Add sample notes
INSERT INTO notes (title, content, template, user_id, favorite) VALUES
(
  'Welcome Note', 
  '{"text": "Welcome to Zotion! This is a sample note to get you started."}', 
  'basic', 
  1, 
  true
),
(
  'Todo List', 
  '{"items": [{"id": "1", "text": "Learn about Zotion", "completed": true}, {"id": "2", "text": "Create my first note", "completed": false}]}', 
  'todo', 
  1, 
  false
),
(
  'Sample Table', 
  '{"columns": ["Name", "Category", "Status"], "rows": [["Item 1", "Category A", "Active"], ["Item 2", "Category B", "Pending"]]}', 
  'table', 
  1, 
  false
);