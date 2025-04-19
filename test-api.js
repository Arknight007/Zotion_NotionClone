const fetch = require('node-fetch');

async function testSignup() {
  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      }),
    });
    
    const data = await response.json();
    console.log('API Response:', data);
    console.log('Status:', response.status);
    
    if (!response.ok) {
      console.error('Registration failed:', data.error);
    } else {
      console.log('Registration successful!');
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error('Make sure the server is running and XAMPP MySQL service is started');
  }
}

testSignup(); 