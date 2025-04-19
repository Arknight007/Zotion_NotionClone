const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

// Database testing functions
async function testDatabaseConnection() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'zotion'
    });

    console.log('MySQL connection successful!');
    
    // Test query
    const [rows] = await connection.query('SELECT * FROM users LIMIT 5');
    console.log('Database query successful. User count:', rows.length);
    if (rows.length > 0) {
      console.log('Sample user:', { 
        id: rows[0].id, 
        name: rows[0].name, 
        email: rows[0].email 
      });
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}

// API testing functions
async function testRegisterAPI() {
  try {
    console.log('\nTesting registration API...');
    const testEmail = `test${Date.now()}@example.com`;
    const userData = {
      name: 'Test User',
      email: testEmail,
      password: 'TestPassword123!'
    };
    
    console.log('Sending data:', userData);
    
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('Registration API test PASSED');
      return true;
    } else {
      console.log('Registration API test FAILED');
      return false;
    }
  } catch (error) {
    console.error('Error testing registration API:', error.message);
    return false;
  }
}

// Test registration with an existing email
async function testDuplicateEmailRegistration() {
  try {
    console.log('\nTesting duplicate email registration...');
    
    // First get an existing user
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'zotion'
    });
    
    const [users] = await connection.query('SELECT * FROM users LIMIT 1');
    await connection.end();
    
    if (users.length === 0) {
      console.log('No existing users found to test with');
      return false;
    }
    
    const existingEmail = users[0].email;
    
    const userData = {
      name: 'Duplicate Test',
      email: existingEmail,
      password: 'TestPassword123!'
    };
    
    console.log('Sending data with existing email:', userData);
    
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok && data.error && data.error.includes('already exists')) {
      console.log('Duplicate email test PASSED - Correctly rejected duplicate email');
      return true;
    } else {
      console.log('Duplicate email test FAILED - Did not correctly handle duplicate email');
      return false;
    }
  } catch (error) {
    console.error('Error testing duplicate email:', error.message);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=== ZOTION REGISTRATION SYSTEM TESTS ===');
  
  // Step 1: Test database connection
  console.log('\n1. Testing database connection...');
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('Database connection failed. Stopping tests.');
    return;
  }
  
  // Step 2: Test registration API
  console.log('\n2. Testing registration API...');
  const registerWorks = await testRegisterAPI();
  if (!registerWorks) {
    console.error('Registration API test failed. Continuing tests but there may be issues.');
  }
  
  // Step 3: Test duplicate email handling
  console.log('\n3. Testing duplicate email handling...');
  const duplicateWorks = await testDuplicateEmailRegistration();
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('Database Connection: ' + (dbConnected ? 'PASS ✓' : 'FAIL ✗'));
  console.log('Registration API: ' + (registerWorks ? 'PASS ✓' : 'FAIL ✗'));
  console.log('Duplicate Email Handling: ' + (duplicateWorks ? 'PASS ✓' : 'FAIL ✗'));
  
  console.log('\nTests completed.');
}

// Run all tests
runTests(); 