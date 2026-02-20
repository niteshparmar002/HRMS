import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Filter, UserCheck } from 'lucide-react'
import { attendanceApi, employeeApi } from '../api/apiService'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'

const INITIAL_FORM = { employee: '', date: '', status: 'Present' }
const PAGE_SIZE = 10

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1, current_page: 1 })
  const [page, setPage] = useState(1)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formApiError, setFormApiError] = useState(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Summary for selected employee filter
  const [summary, setSummary] = useState(null)

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeApi.list()
      setEmployees(res.data.data)
    } catch (_) {}
  }, [])

  const fetchRecords = useCallback(async (targetPage = page) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: targetPage, page_size: PAGE_SIZE }
      if (filterEmployee) params.employee_id = filterEmployee
      if (filterDate) params.date = filterDate
      if (filterStatus) params.status = filterStatus
      const res = await attendanceApi.list(params)
      setRecords(res.data.data)
      setPagination({
        total: res.data.total,
        total_pages: res.data.total_pages,
        current_page: res.data.current_page,
      })
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load attendance records.')
    } finally {
      setLoading(false)
    }
  }, [filterEmployee, filterDate, filterStatus, page])

  const fetchSummary = useCallback(async () => {
    if (!filterEmployee) { setSummary(null); return }
    try {
      const res = await attendanceApi.getByEmployee(filterEmployee)
      setSummary(res.data.summary)
    } catch (_) { setSummary(null) }
  }, [filterEmployee])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])
  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { fetchSummary() }, [fetchSummary])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filterEmployee, filterDate, filterStatus])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchRecords(newPage)
  }

  const validateForm = () => {
    const errs = {}
    if (!formData.employee) errs.employee = 'Please select an employee.'
    if (!formData.date) errs.date = 'Date is required.'
    if (!formData.status) errs.status = 'Status is required.'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    setFormApiError(null)
    try {
      await attendanceApi.create(formData)
      setShowModal(false)
      setFormData(INITIAL_FORM)
      setFormErrors({})
      fetchRecords()
      fetchSummary()
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors && typeof errors === 'object') {
        const mapped = {}
        Object.entries(errors).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val[0] : val
        })
        setFormErrors(mapped)
        if (errors.non_field_errors) {
          setFormApiError(Array.isArray(errors.non_field_errors)
            ? errors.non_field_errors[0]
            : errors.non_field_errors)
        }
      } else {
        setFormApiError(err.friendlyMessage || 'Failed to mark attendance.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await attendanceApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      fetchRecords()
      fetchSummary()
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to delete record.')
    } finally {
      setDeleting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData(INITIAL_FORM)
    setFormErrors({})
    setFormApiError(null)
  }

  const fieldClass = (name) =>
    `input-field ${formErrors[name] ? 'border-red-400 focus:ring-red-400' : ''}`

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} record{pagination.total !== 1 ? 's' : ''} total
            {filterEmployee && summary ? ` · ${summary.present_days} present, ${summary.absent_days} absent` : ''}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Mark Attendance
        </button>
      </div>

      {/* Summary card (when employee filter active) */}
      {filterEmployee && summary && (
        <div className="card p-4 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Attendance Summary</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><span className="font-semibold text-gray-900">{summary.total_days}</span> <span className="text-gray-500">total</span></span>
            <span><span className="font-semibold text-green-700">{summary.present_days}</span> <span className="text-gray-500">present</span></span>
            <span><span className="font-semibold text-red-600">{summary.absent_days}</span> <span className="text-gray-500">absent</span></span>
            <span><span className="font-semibold text-primary-700">{summary.attendance_percentage}%</span> <span className="text-gray-500">attendance</span></span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-gray-400 flex-shrink-0 self-center">
          <Filter className="w-4 h-4" />
        </div>
        <select
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="input-field flex-1 min-w-[160px]"
        >
          <option value="">All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.employee_id} – {e.full_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          max={todayStr}
          onChange={(e) => setFilterDate(e.target.value)}
          className="input-field w-full sm:w-44"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-full sm:w-36"
        >
          <option value="">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
        {(filterEmployee || filterDate || filterStatus) && (
          <button
            onClick={() => { setFilterEmployee(''); setFilterDate(''); setFilterStatus('') }}
            className="btn-secondary text-xs whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Loading attendance..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchRecords} />
        ) : records.length === 0 ? (
          <EmptyState
            title="No attendance records"
            description={filterEmployee || filterDate || filterStatus
              ? 'Try adjusting your filters.'
              : 'Start marking attendance for employees.'}
            action={!filterEmployee && !filterDate && !filterStatus ? (
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Mark Attendance
              </button>
            ) : null}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Employee ID</th>
                    <th className="table-th">Employee Name</th>
                    <th className="table-th">Department</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td text-gray-400 text-xs">{idx + 1}</td>
                      <td className="table-td font-mono text-xs text-gray-500">{rec.employee_id_code}</td>
                      <td className="table-td font-semibold text-gray-900">{rec.employee_name}</td>
                      <td className="table-td">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {rec.department}
                        </span>
                      </td>
                      <td className="table-td text-gray-500">
                        {new Date(rec.date).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="table-td">
                        <Badge label={rec.status} variant={rec.status.toLowerCase()} />
                      </td>
                      <td className="table-td text-right">
                        <button
                          onClick={() => setDeleteTarget(rec)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete record"
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

      {/* Mark Attendance Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Mark Attendance">
        <form onSubmit={handleMarkAttendance} className="space-y-4" noValidate>
          {formApiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {formApiError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              className={fieldClass('employee')}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employee_id} – {e.full_name}
                </option>
              ))}
            </select>
            {formErrors.employee && (
              <p className="mt-1 text-xs text-red-600">{formErrors.employee}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                max={todayStr}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={fieldClass('date')}
              />
              {formErrors.date && (
                <p className="mt-1 text-xs text-red-600">{formErrors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mt-1">
                {['Present', 'Absent'].map((s) => (
                  <label
                    key={s}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                      formData.status === s
                        ? s === 'Present'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      value={s}
                      checked={formData.status === s}
                      onChange={() => setFormData({ ...formData, status: s })}
                    />
                    {s}
                  </label>
                ))}
              </div>
              {formErrors.status && (
                <p className="mt-1 text-xs text-red-600">{formErrors.status}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Mark Attendance'}
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
        title="Delete Attendance Record"
        message={`Delete attendance record for "${deleteTarget?.employee_name}" on ${deleteTarget?.date}? This cannot be undone.`}
      />
    </div>
  )
}
