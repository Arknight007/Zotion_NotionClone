# Zotion - Note Taking Application

A note-taking application with MySQL database connection for XAMPP, similar to Notion.

## Features

- User authentication with session storage
- Note creation and editing
- Various note templates (Basic, Todo list, Table, Timeline, etc.)
- MySQL database integration with XAMPP

## Setup

### Prerequisites

- Node.js (v14 or later)
- XAMPP with MySQL service running

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd zotion
```

2. Install dependencies
```bash
npm install
```

3. Database Setup (choose one method)

#### Method 1: Automatic Setup
```bash
# Start XAMPP with MySQL service running first!
npm run install-db
```

#### Method 2: Manual Setup
- Start XAMPP Control Panel
- Start the MySQL service
- Open http://localhost/phpmyadmin in your browser
- Create a new database named "zotion"
- (Optional) Import the zotion_db.sql file from the project directory

### Running the application

1. Make sure XAMPP is running with MySQL service started

2. Start the server
```bash
npm start
```

3. For development with auto-restart:
```bash
npm run dev
```

4. Access the application in your browser at `http://localhost:3000`

## Checking Database Connection

You can check the database connection status by visiting:
```
http://localhost:3000/api/status
```

## Database Schema

### Users Table
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(255)
- `email`: VARCHAR(255) UNIQUE
- `password`: VARCHAR(255)
- `created_at`: TIMESTAMP

### Notes Table
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `title`: VARCHAR(255)
- `content`: JSON
- `template`: VARCHAR(50)
- `user_id`: INT (FOREIGN KEY)
- `favorite`: BOOLEAN
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Note Templates

- Basic: Simple text editor
- Todo: Task list with completion tracking
- Table: Data organized in rows and columns
- Timeline: Events organized chronologically
- Expense: Expense tracking by category
- Student: Course, assignment, and exam tracking

## Troubleshooting

If you encounter database connection issues:

1. Make sure XAMPP is running with MySQL service started
2. Check if the database "zotion" exists in phpMyAdmin
3. Try running the database installation script: `npm run install-db`
4. Check the default connection settings (host: localhost, user: root, password: empty)
5. Verify MySQL service is running on the default port (3306)