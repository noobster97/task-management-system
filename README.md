# Task Management Application

A full-stack task management system built for the technical assessment. The application provides JWT authentication, role-based task access, a Flask REST API, a React dashboard, MySQL persistence, Docker-based local setup, and automated backend tests.

## What The System Does

- Allows users to register and log in securely
- Stores passwords as hashes, not plain text
- Returns a JWT access token after login
- Protects all task endpoints with authentication
- Lets regular users create, view, update, and delete only their own tasks
- Lets admin users view and manage all tasks
- Lets admins assign tasks to any registered user
- Provides task search and status filtering in the dashboard
- Handles expired or invalid sessions by returning the user to login
- Runs locally with Docker Compose using MySQL
- Includes backend tests for auth, authorization, and task CRUD behavior

## Tech Stack

- Backend: Flask, Flask-SQLAlchemy, Flask-JWT-Extended, PyMySQL
- Frontend: React, Vite, lucide-react
- Database: MySQL 8
- Testing: pytest
- Infrastructure: Docker and Docker Compose

## Project Structure

```text
backend/
  app/
    routes/
      auth.py
      tasks.py
      users.py
    config.py
    models.py
  tests/
  Dockerfile
  pytest.ini
  requirements.txt
  run.py
frontend/
  src/
    pages/
    services/
    styles/
  Dockerfile
  nginx.conf
  package.json
docker-compose.yml
vercel.json
```

## Main Features

### Authentication

- `POST /auth/register` creates a user
- `POST /auth/login` validates credentials and returns a JWT
- Passwords are hashed with Werkzeug security utilities
- Auth errors return clear JSON responses

### Task Management

- `GET /tasks` returns tasks visible to the logged-in user
- `POST /tasks` creates a task
- `PUT /tasks/<id>` updates a task
- `DELETE /tasks/<id>` deletes a task
- Valid task statuses are `pending`, `in_progress`, and `completed`

### Role-Based Access

- Regular users can only manage tasks linked to their own user id
- Admin users can view and manage every task
- Admin users can list users with `GET /users`
- Admin users can assign or reassign task ownership

### Frontend Dashboard

- Login and register screens
- Task summary counts by status
- Add task form
- Search tasks by title, description, or owner email
- Filter tasks by status
- Edit tasks and save changes explicitly
- Delete tasks
- Admin owner selection for task assignment

## Run Locally With Docker Compose

From the project root:

```bash
docker compose up --build
```

Local services:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000`
- MySQL: `localhost:3306`

The backend creates the database tables automatically when `AUTO_CREATE_TABLES=true`.

## Run Backend Without Docker

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Example backend environment:

```env
SECRET_KEY=replace-with-a-long-random-secret
JWT_SECRET_KEY=replace-with-a-long-random-jwt-secret
DATABASE_URL=mysql+pymysql://task_user:task_password@localhost:3306/task_manager
CORS_ORIGINS=http://localhost:5173
AUTO_CREATE_TABLES=true
```

## Run Frontend Without Docker

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Example frontend environment:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## API Reference

### Register

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "role": "user"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response includes:

```json
{
  "access_token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Authenticated Requests

Use the token from login:

```http
Authorization: Bearer <jwt-token>
```

### Create Task

```http
POST /tasks
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

```json
{
  "title": "Prepare report",
  "description": "Finish documentation",
  "status": "pending"
}
```

Admins may also pass `user_id` to assign a task to another user.

### Update Task

```http
PUT /tasks/1
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

```json
{
  "title": "Prepare final report",
  "description": "Finish documentation and testing",
  "status": "completed"
}
```

### Delete Task

```http
DELETE /tasks/1
Authorization: Bearer <jwt-token>
```

### List Users

Admin only:

```http
GET /users
Authorization: Bearer <jwt-token>
```

## Database Tables

### users

| Column | Description |
| --- | --- |
| id | Primary key |
| email | Unique user email |
| password_hash | Hashed password |
| role | `user` or `admin` |
| created_at | Creation timestamp |

### tasks

| Column | Description |
| --- | --- |
| id | Primary key |
| title | Task title |
| description | Task details |
| status | `pending`, `in_progress`, or `completed` |
| user_id | Owner user id |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

## Run Tests

Backend tests use SQLite in memory, so they do not require MySQL.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

Expected result:

```text
8 passed
```

Frontend production build:

```bash
cd frontend
npm install
npm run build
```

## Hosting Notes

The frontend is a static React build and can run on any static hosting platform. The backend is a Flask API and should run on a server or platform that supports long-running Python web services. The database should be a persistent MySQL instance.

Required production environment values:

```env
SECRET_KEY=<secure-secret>
JWT_SECRET_KEY=<secure-jwt-secret>
DATABASE_URL=<mysql-connection-url>
CORS_ORIGINS=<frontend-origin>
VITE_API_BASE_URL=<backend-api-url>
```

## Security Notes

- Use strong secrets for `SECRET_KEY` and `JWT_SECRET_KEY`
- Use HTTPS in production
- Restrict `CORS_ORIGINS` to trusted frontend domains
- Do not commit real `.env` files
- Keep database credentials outside source code

## Assessment Coverage Checklist

- Backend CRUD APIs: complete
- Backend validation and error handling: complete
- User registration and login: complete
- JWT-protected task endpoints: complete
- MySQL persistence: complete
- Password hashing: complete
- React login/register/dashboard: complete
- JWT attached to API calls: complete
- Unauthorized request handling: complete
- Admin and regular user authorization rules: complete
- Dockerfiles: complete
- Docker Compose with database: complete
- README setup and test instructions: complete
- Automated backend tests: complete
