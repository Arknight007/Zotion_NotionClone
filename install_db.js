/**
 * Zotion Database Installation Script
 * 
 * This script will initialize the MySQL database for Zotion.
 * Run this script before starting the server if you're having
 * database connection issues.
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: ''
};

// Main installation function
async function installDatabase() {
  console.log('Starting Zotion database installation...');
  console.log('--------------------------------------');

  try {
    // Create connection to MySQL
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL successfully.');

    // Create database
    console.log('Creating zotion database if it doesn\'t exist...');
    await connection.query('CREATE DATABASE IF NOT EXISTS zotion');
    console.log('Database created or already exists.');

    // Switch to zotion database
    console.log('Switching to zotion database...');
    await connection.query('USE zotion');
    console.log('Using zotion database.');

    // Read SQL file
    console.log('Reading SQL file...');
    const sqlFilePath = path.join(__dirname, 'zotion_db.sql');
    const sqlFile = await fs.readFile(sqlFilePath, 'utf8');
    console.log('SQL file read successfully.');

    // Split SQL file into individual statements
    console.log('Executing SQL statements...');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (err) {
          console.warn(`Warning: ${err.message}`);
          // Continue with the next statement even if this one fails
        }
      }
    }
    
    console.log('SQL statements executed successfully.');

    // Close connection
    await connection.end();
    console.log('Database connection closed.');

    console.log('--------------------------------------');
    console.log('Zotion database installation complete!');
    console.log('You can now start the server with: npm start');
    
    return true;
  } catch (error) {
    console.error('--------------------------------------');
    console.error('Error installing database:', error.message);
    console.error('');
    console.error('Please make sure:');
    console.error('1. XAMPP is running with MySQL service started');
    console.error('2. MySQL username and password are correct (default: root with no password)');
    console.error('3. You have necessary permissions to create databases');
    console.error('');
    console.error('You can also try to manually import the zotion_db.sql file using phpMyAdmin:');
    console.error('1. Open http://localhost/phpmyadmin in your browser');
    console.error('2. Create a new database named "zotion"');
    console.error('3. Import the zotion_db.sql file into the database');
    
    return false;
  }
}

// Run the installation
installDatabase().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 