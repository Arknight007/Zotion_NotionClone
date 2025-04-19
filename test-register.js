// Simple script to test the register API endpoint
const fetch = require('node-fetch');

async function testRegister() {
  try {
    console.log('Testing registration API...');
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test' + Date.now() + '@example.com', // Unique email to avoid conflicts
        password: 'Password123!',
      }),
    });
    
    const data = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response Body:', data);
    
    if (!response.ok) {
      console.error('Registration failed:', data.error);
    } else {
      console.log('Registration successful!');
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error('Make sure the server is running on port 3000');
  }
}

// Run the test
testRegister(); 