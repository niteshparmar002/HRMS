# HRMS Lite – Human Resource Management System

A lightweight, production-ready HRMS web application built with **Django REST Framework** (backend) and **React + Vite + Tailwind CSS** (frontend), backed by **MySQL**.

---

## Features

- **Dashboard** – stats for total employees, present/absent today, recent records
- **Employee Management** – add, list (search & filter), and delete employees
- **Attendance Management** – mark attendance (Present/Absent), filter by employee/date/status, delete records
- **Per-employee attendance summary** – total days, present days, attendance percentage
- Clean, professional UI with loading, empty, and error states throughout

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Backend   | Python 3.13+, Django 6.0, Django REST Framework     |
| Database  | MySQL 8.0+, PyMySQL (pure-Python MySQL driver)      |
| Frontend  | React 18, Vite 5, Tailwind CSS 3, React Router v6   |
| HTTP      | Axios                                               |
| Icons     | Lucide React                                        |

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0+ (running locally)

> **Note:** This project uses **PyMySQL** (pure Python) — no MySQL system headers or native drivers required.
> MySQL 8.0 uses `caching_sha2_password` auth by default. The `cryptography` package (included in `requirements.txt`) handles this automatically.

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd HRMS
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set your MySQL credentials
```

**Generate a secret key:**
```bash
python manage.py shell -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**`.env` example:**
```
SECRET_KEY=pgjzq+y_ccuj9b97c4%5w#6f9+dyme3uu!(^k=#s5zl9qy^%5+
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> **Note:** Always generate a fresh `SECRET_KEY` for production. Never reuse a key that has been committed to a public repository.

**Create the MySQL database:**
```sql
CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Run migrations and start the server:**
```bash
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment (optional — defaults to localhost:8000)
cp .env.example .env
# Edit VITE_API_URL if needed

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## API Reference

### Employees

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/employees/`              | List all employees             |
| POST   | `/api/employees/`              | Create a new employee          |
| GET    | `/api/employees/{id}/`         | Get employee details           |
| DELETE | `/api/employees/{id}/`         | Delete an employee             |
| GET    | `/api/departments/`            | List distinct departments      |

**Query params for GET `/api/employees/`:**
- `search` – search by name, ID, or email
- `department` – filter by department

### Attendance

| Method | Endpoint                              | Description                         |
|--------|---------------------------------------|-------------------------------------|
| GET    | `/api/attendance/`                    | List attendance records             |
| POST   | `/api/attendance/`                    | Mark attendance                     |
| PUT    | `/api/attendance/{id}/`               | Update an attendance record         |
| DELETE | `/api/attendance/{id}/`               | Delete an attendance record         |
| GET    | `/api/employees/{id}/attendance/`     | Get attendance summary for employee |

**Query params for GET `/api/attendance/`:**
- `employee_id` – filter by employee
- `date` – filter by exact date (YYYY-MM-DD)
- `date_from` / `date_to` – date range filter
- `status` – filter by Present / Absent

### Dashboard

| Method | Endpoint          | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/api/dashboard/` | Dashboard stats & recent data  |

---

## Project Structure

```
HRMS/
├── backend/
│   ├── hrms_backend/        # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── exception_handler.py
│   ├── employees/           # Employee app
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── attendance/          # Attendance app
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── apiService.js     # Axios API client
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Modal.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── Badge.jsx
    │   │   ├── StatsCard.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── EmptyState.jsx
    │   │   └── ErrorMessage.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx
    │   │   └── Attendance.jsx
    │   └── App.jsx
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Deployment

### Backend + Database → Railway (Free)

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select this repo → set root directory to `backend`
3. Add a **MySQL** plugin inside the project (Railway provisions it automatically)
4. Set these **environment variables** in Railway dashboard:

```
SECRET_KEY=<generate a new one>
DEBUG=False
ALLOWED_HOSTS=<your-railway-app>.up.railway.app
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
```

5. Railway auto-detects the `Procfile` and runs:
   ```
   gunicorn hrms_backend.wsgi:application
   ```
6. Add a **Deploy Command** in Railway settings:
   ```
   python manage.py migrate
   ```

---

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://<your-railway-app>.up.railway.app/api
   ```
4. Click **Deploy** — Vercel auto-detects Vite and runs `npm run build`
5. `vercel.json` handles React Router redirects automatically

---

### After Deployment

Update your `.env` locally:
```
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
```

---

## Running Tests

```bash
cd backend
source venv/bin/activate
python manage.py test employees attendance --verbosity=2
```

Tests cover:
- Employee list, search, department filter, pagination
- Employee create — success, duplicate ID/email, invalid email, short name
- Employee delete — success, 404 on missing ID
- Attendance mark — Present/Absent, future date rejection, invalid status
- Duplicate attendance prevention (same employee + date)
- Attendance filters — by employee, status, date
- Per-employee attendance summary (totals & percentage)
- Attendance delete — success, 404 on missing ID

---

## Assumptions & Limitations

- Single admin user — no authentication or role-based access
- Leave management, payroll, and advanced HR features are out of scope
- Attendance can only be marked up to today's date (no future dates)
- One attendance record per employee per date (duplicate entries are rejected)
- Deleting an employee also deletes all their attendance records (cascade delete)
- List endpoints are paginated (10 records per page) — large datasets will not be loaded all at once
