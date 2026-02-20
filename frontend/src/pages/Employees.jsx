import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Search, Users } from 'lucide-react'
import { employeeApi } from '../api/apiService'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'HR', 'Finance', 'Operations', 'Legal', 'Customer Support',
]

const INITIAL_FORM = { employee_id: '', full_name: '', email: '', department: '' }
const PAGE_SIZE = 10

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1, current_page: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formApiError, setFormApiError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEmployees = useCallback(async (targetPage = page) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: targetPage, page_size: PAGE_SIZE }
      if (search.trim()) params.search = search.trim()
      if (deptFilter) params.department = deptFilter
      const res = await employeeApi.list(params)
      setEmployees(res.data.data)
      setPagination({
        total: res.data.total,
        total_pages: res.data.total_pages,
        current_page: res.data.current_page,
      })
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load employees.')
    } finally {
      setLoading(false)
    }
  }, [search, deptFilter, page])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1)
  }, [search, deptFilter])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchEmployees(newPage)
  }

  const validateForm = () => {
    const errs = {}
    if (!formData.employee_id.trim()) errs.employee_id = 'Employee ID is required.'
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required.'
    if (!formData.email.trim()) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address.'
    }
    if (!formData.department.trim()) errs.department = 'Department is required.'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    setFormApiError(null)
    try {
      await employeeApi.create(formData)
      setShowAddModal(false)
      setFormData(INITIAL_FORM)
      setFormErrors({})
      fetchEmployees()
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors && typeof errors === 'object') {
        const mapped = {}
        Object.entries(errors).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val[0] : val
        })
        setFormErrors(mapped)
      } else {
        setFormApiError(err.friendlyMessage || 'Failed to add employee.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await employeeApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      fetchEmployees()
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to delete employee.')
    } finally {
      setDeleting(false)
    }
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setFormData(INITIAL_FORM)
    setFormErrors({})
    setFormApiError(null)
  }

  const fieldClass = (name) =>
    `input-field ${formErrors[name] ? 'border-red-400 focus:ring-red-400' : ''}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} employee{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="input-field sm:w-52"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Loading employees..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchEmployees} />
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={search || deptFilter ? 'Try adjusting your filters.' : 'Add your first employee to get started.'}
            action={
              !search && !deptFilter ? (
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Employee
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">Employee ID</th>
                    <th className="table-th">Full Name</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Department</th>
                    <th className="table-th">Present Days</th>
                    <th className="table-th">Joined</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td font-mono text-xs text-gray-500">{emp.employee_id}</td>
                      <td className="table-td font-semibold text-gray-900">{emp.full_name}</td>
                      <td className="table-td text-gray-500">{emp.email}</td>
                      <td className="table-td">
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          {emp.department}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="inline-flex items-center gap-1 text-green-700 font-medium text-sm">
                          <Users className="w-3 h-3" />
                          {emp.present_days}
                        </span>
                      </td>
                      <td className="table-td text-gray-400 text-xs">
                        {new Date(emp.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="table-td text-right">
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              total={pagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            /></>

        )}
      </div>

      {/* Add Employee Modal */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} title="Add New Employee">
        <form onSubmit={handleAddEmployee} className="space-y-4" noValidate>
          {formApiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {formApiError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. EMP001"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className={fieldClass('employee_id')}
              />
              {formErrors.employee_id && (
                <p className="mt-1 text-xs text-red-600">{formErrors.employee_id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={fieldClass('department')}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrors.department && (
                <p className="mt-1 text-xs text-red-600">{formErrors.department}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={fieldClass('full_name')}
            />
            {formErrors.full_name && (
              <p className="mt-1 text-xs text-red-600">{formErrors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. jane@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={fieldClass('email')}
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeAddModal} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This will also delete all their attendance records. This action cannot be undone.`}
      />
    </div>
  )
}
