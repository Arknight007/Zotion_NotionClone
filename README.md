# 📒 Zotion - Note Taking Application

A feature-rich note-taking app inspired by Notion, built with Node.js and MySQL using XAMPP.

![License](https://img.shields.io/github/license/Arknight007/Zotion_NotionClone?style=flat-circle)  ![Stars](https://img.shields.io/github/stars/Arknight007/Zotion_NotionClone?style=flat-circle)  ![Issues](https://img.shields.io/github/issues/Arknight007/Zotion_NotionClone?style=flat-circle)  ![Forks](https://img.shields.io/github/forks/Arknight007/Zotion_NotionClone?style=flat-circle)  ![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green?style=flat-circle)

---

## 🧠 Features

- 🔐 User authentication with session storage  
- 📝 Rich note creation and editing  
- 🧩 Multiple note templates (Todo List, Table, Timeline, etc.)  
- 🗂️ MySQL database integration with XAMPP  
- ⭐ Favorite notes  
- ⏰ Timestamps for version tracking  

---

## ⚙️ Tech Stack

| Layer     | Technology            |
|-----------|------------------------|
| Frontend  | HTML, CSS, JavaScript  |
| Backend   | Node.js, Express.js    |
| Database  | MySQL (via XAMPP)      |
| Auth      | Session-based auth     |
| Runtime   | Node.js                |

---

## 🏗️ Architecture

```
Client (Browser)
   |
   | HTTP Requests (CRUD Notes, Login, etc.)
   v
Backend (Node.js + Express)
   |
   | SQL Queries
   v
Database (MySQL via XAMPP)
```

---

## 🚀 Getting Started

### 📦 Prerequisites

- ✅ Node.js (v14 or later)  
- ✅ XAMPP with MySQL service running

### 🔧 Installation

1. **Clone the Repository**

```bash
git clone https://github.com/Arknight007/Zotion_NotionClone.git
cd Zotion_NotionClone
```

2. **Install Dependencies**

```bash
npm install
```

3. **Database Setup (choose one)**

#### 🛠️ Method 1: Automatic Setup

```bash
# Make sure XAMPP is running with MySQL first!
npm run install-db
```

#### 🧑‍🔧 Method 2: Manual Setup

- Open XAMPP Control Panel and start MySQL  
- Go to http://localhost/phpmyadmin  
- Create a database named `zotion`  
- (Optional) Import the `zotion_db.sql` file provided in the repo  

---

## 🏃‍♂️ Running the Application

1. **Start MySQL in XAMPP**

2. **Start the server**

```bash
npm start
```

3. **For development (with auto-restart)**

```bash
npm run dev
```

4. **Access the app**

```
http://localhost:3000
```

---

## 🧪 Check Database Connection

Visit:  
```
http://localhost:3000/api/status
```

---

## 🗃️ Database Schema

### 🔐 Users Table

| Column       | Type                    | Description             |
|--------------|-------------------------|-------------------------|
| `id`         | INT, PK, AUTO_INCREMENT | Unique ID               |
| `name`       | VARCHAR(255)           | User's full name        |
| `email`      | VARCHAR(255), UNIQUE   | Email ID                |
| `password`   | VARCHAR(255)           | Hashed password         |
| `created_at` | TIMESTAMP              | Account creation time   |

### 📝 Notes Table

| Column       | Type                    | Description              |
|--------------|-------------------------|--------------------------|
| `id`         | INT, PK, AUTO_INCREMENT | Unique Note ID           |
| `title`      | VARCHAR(255)           | Title of the note        |
| `content`    | JSON                   | Note content (formatted) |
| `template`   | VARCHAR(50)            | Template type            |
| `user_id`    | INT, FK                | Associated user ID       |
| `favorite`   | BOOLEAN                | Marked as favorite       |
| `created_at` | TIMESTAMP              | Creation date            |
| `updated_at` | TIMESTAMP              | Last modified time       |

---

## 🧱 Note Templates

- 📄 **Basic** – Simple text editor  
- ✅ **Todo** – Task list with checkbox  
- 📊 **Table** – Data in rows and columns  
- 🕒 **Timeline** – Chronological event tracker  
- 💰 **Expense** – Budget/expense tracking  
- 🎓 **Student** – Course and assignment management  

---

## 🛠 Troubleshooting

- ✅ Ensure MySQL is running via XAMPP  
- ✅ Confirm `zotion` database exists in phpMyAdmin  
- ✅ Run: `npm run install-db`  
- ✅ Check default DB config:  
  - Host: `localhost`  
  - User: `root`  
  - Password: _(empty)_  
  - Port: `3306`  

---

## 📌 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📃 License

This project is [MIT](LICENSE) licensed.

---

## 🙌 Acknowledgements

Inspired by Notion and other minimalist note-taking tools.
