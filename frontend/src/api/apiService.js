import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred.'
    return Promise.reject({ ...error, friendlyMessage: message })
  }
)

// ── Employees ──────────────────────────────────────────────
export const employeeApi = {
  list: (params = {}) => api.get('/employees/', { params }),
  create: (data) => api.post('/employees/', data),
  delete: (id) => api.delete(`/employees/${id}/`),
  getById: (id) => api.get(`/employees/${id}/`),
}

// ── Attendance ─────────────────────────────────────────────
export const attendanceApi = {
  list: (params = {}) => api.get('/attendance/', { params }),
  create: (data) => api.post('/attendance/', data),
  update: (id, data) => api.put(`/attendance/${id}/`, data),
  delete: (id) => api.delete(`/attendance/${id}/`),
  getByEmployee: (employeeId) => api.get(`/employees/${employeeId}/attendance/`),
}

// ── Dashboard ──────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/'),
}

// ── Departments ────────────────────────────────────────────
export const departmentApi = {
  list: () => api.get('/departments/'),
}
