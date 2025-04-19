const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

// Create Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '/')));

// MySQL Database connection with improved error handling
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'zotion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

const db = mysql.createPool(dbConfig);

// Test database connection and make sure the database exists
async function testDatabaseConnection() {
  try {
    // First test connection to MySQL without specifying database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    console.log('MySQL connection successful');
    
    // Check if database exists, create it if it doesn't
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS zotion`);
      console.log('Database "zotion" is ready');
    } catch (dbCreateError) {
      console.error('Error creating database:', dbCreateError.message);
      console.error('You may need to manually create the "zotion" database in phpMyAdmin');
      return false;
    }
    
    // Close the initial connection
    await connection.end();
    
    // Test connection to the actual database
    try {
      await db.query('SELECT 1');
      console.log('Connected to zotion database successfully');
      
      // Initialize tables after confirming connection works
      await initDatabase();
      
      return true;
    } catch (dbConnectError) {
      console.error('Error connecting to zotion database:', dbConnectError.message);
      console.error('The database exists but could not be connected to');
      return false;
    }
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    console.error('Please make sure MySQL server is running (check XAMPP control panel)');
    return false;
  }
}

// Import SQL file if database is empty
async function importSQLFile() {
  try {
    // Check if users table is empty
    const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('Database is empty, importing sample data...');
      
      try {
        // Read SQL file
        const sqlFilePath = path.join(__dirname, 'zotion_db.sql');
        const fileExists = await fs.access(sqlFilePath).then(() => true).catch(() => false);
        
        if (fileExists) {
          const sqlFile = await fs.readFile(sqlFilePath, 'utf8');
          
          // Split SQL file into individual statements
          const statements = sqlFile.split(';').filter(stmt => stmt.trim() !== '');
          
          // Execute each statement
          for (const statement of statements) {
            if (statement.trim().toLowerCase().startsWith('insert')) {
              await db.query(statement);
            }
          }
          
          console.log('Sample data imported successfully');
        } else {
          console.log('No SQL file found, skipping import');
        }
      } catch (importError) {
        console.error('Error importing SQL file:', importError.message);
      }
    }
  } catch (error) {
    console.error('Error checking if database is empty:', error.message);
  }
}

// Initialize database tables
async function initDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create notes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content JSON NOT NULL,
        template VARCHAR(50) NOT NULL,
        user_id INT NOT NULL,
        collection_id INT NULL,
        favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create collections table
    await db.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add foreign key for collection_id in notes table
    try {
      await db.query(`
        ALTER TABLE notes 
        ADD CONSTRAINT fk_collection_id 
        FOREIGN KEY (collection_id) REFERENCES collections(id) 
        ON DELETE SET NULL
      `);
    } catch (fkError) {
      // Foreign key might already exist, which is fine
      console.log('Note: Foreign key for collection_id may already exist');
    }
    
    console.log('Database tables initialized');
    
    // Import sample data if database is empty
    await importSQLFile();
    
  } catch (error) {
    console.error('Error initializing database tables:', error.message);
    throw error; // Re-throw so the calling function can handle it
  }
}

// API endpoint to check database status
app.get('/api/status', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as status');
    res.status(200).json({ 
      status: 'ok',
      message: 'Database connected successfully',
      dbStatus: result[0].status === 1
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Hash the password for security (in production)
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    console.log('Creating new user:', { name, email });
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password] // Use hashedPassword in production
    );
    console.log('User created with ID:', result.insertId);
    
    // Get the created user
    const [user] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [result.insertId]);
    
    const responseData = {
      _id: user[0].id,
      name: user[0].name,
      email: user[0].email
    };
    console.log('Registration successful, sending response:', responseData);
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // In production, use bcrypt.compare(password, user.password)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// Get a single note by id - This route must be defined BEFORE the userId route to avoid conflict
app.get('/api/notes/note/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId]);
    
    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = notes[0];
    let parsedContent;
    
    try {
      // Handle potential invalid JSON in database
      parsedContent = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      parsedContent = {}; // Default empty object if JSON is invalid
    }
    
    res.status(200).json({
      _id: note.id,
      title: note.title,
      content: parsedContent,
      template: note.template,
      userId: note.user_id,
      collection: note.collection_id,
      favorite: note.favorite === 1,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note: ' + error.message });
  }
});

// Get notes for a user
app.get('/api/notes/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const [notes] = await db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    
    // Parse JSON content field
    const formattedNotes = notes.map(note => {
      let parsedContent;
      try {
        // Handle potential invalid JSON in database
        parsedContent = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        parsedContent = {}; // Default empty object if JSON is invalid
      }
      
      return {
        _id: note.id,
        title: note.title,
        content: parsedContent,
        template: note.template,
        userId: note.user_id,
        collection: note.collection_id,
        favorite: note.favorite === 1, // Convert tinyint to boolean
        createdAt: note.created_at,
        updatedAt: note.updated_at
      };
    });
    
    res.status(200).json(formattedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes: ' + error.message });
  }
});

// Create a note
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, template, userId, collection } = req.body;
    
    if (!title || !content || !template || !userId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Ensure content is properly formatted as JSON
    const contentJson = typeof content === 'string' ? content : JSON.stringify(content);
    
    let collectionId = null;
    if (collection) {
      // Check if the collection exists
      const [collections] = await db.query('SELECT id FROM collections WHERE id = ? AND user_id = ?', [collection, userId]);
      if (collections.length > 0) {
        collectionId = collections[0].id;
      }
    }
    
    const [result] = await db.query(
      'INSERT INTO notes (title, content, template, user_id, collection_id) VALUES (?, ?, ?, ?, ?)',
      [title, contentJson, template, userId, collectionId]
    );
    
    // Get the created note
    const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);
    
    if (notes.length === 0) {
      throw new Error('Note was created but could not be retrieved');
    }
    
    const note = notes[0];
    
    let parsedContent;
    try {
      parsedContent = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      parsedContent = {}; // Default empty object if JSON is invalid
    }
    
    res.status(201).json({
      _id: note.id,
      title: note.title,
      content: parsedContent,
      template: note.template,
      userId: note.user_id,
      collection: note.collection_id,
      favorite: note.favorite === 1,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note: ' + error.message });
  }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, favorite } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    // Check if note exists
    const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Prepare update values
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      // Ensure content is properly formatted as JSON
      updates.content = typeof content === 'string' ? content : JSON.stringify(content);
    }
    if (favorite !== undefined) updates.favorite = favorite;
    
    // Build query
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    // Create SET part of query
    const setClause = Object.entries(updates)
      .map(([key, _]) => `${key} = ?`)
      .join(', ');
    
    // Create values array for query
    const values = Object.values(updates);
    values.push(noteId);
    
    // Execute update
    await db.query(`UPDATE notes SET ${setClause} WHERE id = ?`, values);
    
    // Get updated note
    const [updatedNotes] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId]);
    
    if (updatedNotes.length === 0) {
      throw new Error('Note was updated but could not be retrieved');
    }
    
    const note = updatedNotes[0];
    
    let parsedContent;
    try {
      parsedContent = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      parsedContent = {}; // Default empty object if JSON is invalid
    }
    
    res.status(200).json({
      _id: note.id,
      title: note.title,
      content: parsedContent,
      template: note.template,
      userId: note.user_id,
      favorite: note.favorite === 1,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note: ' + error.message });
  }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    // Check if note exists
    const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Delete the note
    await db.query('DELETE FROM notes WHERE id = ?', [noteId]);
    
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note: ' + error.message });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/note-editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'note-editor.html'));
});

app.get('/note-editor.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'note-editor.html'));
});

app.get('/view-note', (req, res) => {
  res.sendFile(path.join(__dirname, 'view-note.html'));
});

app.get('/view-note.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'view-note.html'));
});

app.get('/templates', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates.html'));
});

app.get('/templates.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates.html'));
});

// Handle 404 errors - must be after all other routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start server with database check
async function startServer() {
  console.log('Starting Zotion server with MySQL/XAMPP...');
  console.log('IMPORTANT: Make sure XAMPP is running with MySQL service started');
  console.log('If you encounter errors, please:');
  console.log('1. Open XAMPP Control Panel');
  console.log('2. Start the MySQL service');
  console.log('3. Open http://localhost/phpmyadmin in your browser');
  console.log('4. Create a new database named "zotion" if it doesn\'t exist');
  console.log('5. You can also import the zotion_db.sql file manually if needed');
  console.log('-------------------------------------------------------');
  
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Open http://localhost:${PORT} in your browser to use Zotion`);
      console.log(`You can check database status at http://localhost:${PORT}/api/status`);
    });
  } else {
    console.error('-------------------------------------------------------');
    console.error('Failed to connect to the database. Server not started.');
    console.error('Please check the error messages above and fix any issues with your XAMPP MySQL setup.');
    process.exit(1);
  }
}

// Start the server
startServer(); 