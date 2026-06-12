# 💼 Employee Expert System — Task Management Dashboard

A full-stack web application with role-based task management for Managers and Employees.

---

## 🗂 Project Structure

```
employee-expert-system/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, GetMe
│   │   ├── taskController.js   # CRUD + analytics + comments
│   │   └── userController.js   # Employee list, profile
│   ├── middleware/
│   │   └── auth.js             # JWT protect + role authorize
│   ├── models/
│   │   ├── User.js             # User schema (manager/employee)
│   │   └── Task.js             # Task schema with progress, comments
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── seed.js                 # Demo data seeder
│   ├── server.js               # Express app entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/                   # Vanilla HTML/CSS/JS
    ├── css/
    │   └── style.css           # Full design system (dark/light mode)
    ├── js/
    │   └── api.js              # API client + auth + UI helpers
    └── pages/
        ├── login.html          # Login & Signup page
        ├── manager-dashboard.html
        └── employee-dashboard.html
```

---

## ⚙️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript   |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB + Mongoose ODM            |
| Auth       | JWT (JSON Web Tokens) + bcryptjs  |
| Dev Tool   | Nodemon                           |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+ installed → [nodejs.org](https://nodejs.org)
- MongoDB installed locally **OR** a free [MongoDB Atlas](https://mongodb.com/atlas) cluster

---

### Step 1 — Clone or extract the project

```bash
cd employee-expert-system
```

---

### Step 2 — Backend setup

```bash
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Now open `.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/employee_expert_system
JWT_SECRET=pick_any_long_random_string_here
JWT_EXPIRE=7d
```

> **Using MongoDB Atlas?** Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/employee_expert_system`

---

### Step 3 — Seed demo data (optional but recommended)

```bash
node seed.js
```

This creates:
- 1 Manager + 4 Employees with hashed passwords
- 10 sample tasks in various states

---

### Step 4 — Start the backend

```bash
npm run dev       # development (auto-restart with nodemon)
# OR
npm start         # production
```

Server runs at: **http://localhost:5000**

Test it: open http://localhost:5000/api/health in your browser.

---

### Step 5 — Open the frontend

**Option A — VS Code Live Server (easiest)**
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/pages/login.html` → Open with Live Server
3. It opens at `http://127.0.0.1:5500/frontend/pages/login.html`

**Option B — npx serve**
```bash
# From the root employee-expert-system folder
npx serve frontend
# Open: http://localhost:3000/pages/login.html
```

**Option C — Python (if installed)**
```bash
cd frontend
python -m http.server 3000
# Open: http://localhost:3000/pages/login.html
```

---

## 🔑 Demo Login Credentials

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Manager  | manager@demo.com       | demo1234   |
| Employee | employee@demo.com      | demo1234   |
| Employee | amit@demo.com          | demo1234   |
| Employee | sneha@demo.com         | demo1234   |
| Employee | karan@demo.com         | demo1234   |

---

## 🌐 API Endpoints

### Auth
```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Login → returns JWT token
GET    /api/auth/me           Get logged-in user (protected)
```

### Tasks
```
GET    /api/tasks             Get all tasks (filtered by role)
POST   /api/tasks             Create task (manager only)
GET    /api/tasks/:id         Get single task
PUT    /api/tasks/:id         Update task (manager: full | employee: status+progress)
DELETE /api/tasks/:id         Delete task (manager only)
POST   /api/tasks/:id/comments  Add comment
GET    /api/tasks/analytics   Get performance stats (manager only)
```

### Users
```
GET    /api/users/employees   Get all employees (manager only)
GET    /api/users/profile     Get own profile
PUT    /api/users/profile     Update own profile
```

---

## ✨ Features

### Manager Dashboard
- ✅ Create, edit, delete tasks
- ✅ Assign tasks to specific employees
- ✅ Set title, description, deadline, priority, tags
- ✅ View all tasks with filters (status, priority, search)
- ✅ Task detail modal with comments
- ✅ Analytics page: completion rates, per-employee stats
- ✅ Employee directory with quick assign

### Employee Dashboard
- ✅ View only tasks assigned to them
- ✅ Update task status (Pending → In Progress → Completed)
- ✅ Update progress percentage via slider
- ✅ Add comments to tasks
- ✅ Progress overview page with bar charts
- ✅ Profile management

### Shared
- ✅ JWT authentication (secure, stateless)
- ✅ Role-based access control
- ✅ Dark mode / Light mode toggle (persisted)
- ✅ Responsive design (mobile-friendly sidebar)
- ✅ Toast notifications
- ✅ Auto-mark overdue tasks
- ✅ Greeting banner with time of day

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire in 7 days
- Role-based middleware prevents employees from accessing manager routes
- Employees can only update tasks assigned to them

---

## 🧩 Optional Enhancements (for future)

- [ ] Email notifications via Nodemailer
- [ ] File attachments on tasks
- [ ] Real-time updates via Socket.io
- [ ] Export reports to PDF/Excel
- [ ] Admin panel to manage all users

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `CORS error` | Make sure backend is running on port 5000 |
| `MongoDB connection failed` | Check your MONGO_URI in `.env` |
| `Cannot GET /api/...` | Backend not running — run `npm run dev` |
| `401 Unauthorized` | Token expired — log in again |
| Frontend shows blank | Check browser console; make sure you're using a local server, not file:// |
