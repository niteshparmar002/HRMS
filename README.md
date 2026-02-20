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

### Backend (e.g., Railway / Render / DigitalOcean)

1. Set `DEBUG=False` and update `ALLOWED_HOSTS` in `.env`
2. Set `CORS_ALLOWED_ORIGINS` to your frontend URL
3. Run `python manage.py collectstatic` for static files
4. Use **gunicorn** as the production server:
   ```bash
   pip install gunicorn
   gunicorn hrms_backend.wsgi:application --bind 0.0.0.0:8000
   ```

### Frontend (e.g., Vercel / Netlify)

1. Set `VITE_API_URL` to your deployed backend URL
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. Deploy the `dist/` folder

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
