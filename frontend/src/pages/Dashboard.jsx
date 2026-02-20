import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCheck, UserX, ClipboardList, ArrowRight } from 'lucide-react'
import { dashboardApi } from '../api/apiService'
import StatsCard from '../components/StatsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Badge from '../components/Badge'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getStats()
      setStats(res.data.data)
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your HR data</p>
      </div>

      {loading && <LoadingSpinner message="Loading dashboard..." />}
      {error && <ErrorMessage message={error} onRetry={fetchStats} />}

      {!loading && !error && stats && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              title="Total Employees"
              value={stats.total_employees}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Present Today"
              value={stats.present_today}
              icon={UserCheck}
              color="green"
              subtitle="Marked present"
            />
            <StatsCard
              title="Absent Today"
              value={stats.absent_today}
              icon={UserX}
              color="red"
              subtitle="Marked absent"
            />
            <StatsCard
              title="Total Attendance Records"
              value={stats.total_attendance_records}
              icon={ClipboardList}
              color="purple"
            />
          </div>

          {/* Tables row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent employees */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Recent Employees</h2>
                <Link to="/employees" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {stats.recent_employees.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No employees yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-th">ID</th>
                        <th className="table-th">Name</th>
                        <th className="table-th">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recent_employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="table-td font-mono text-xs text-gray-500">{emp.employee_id}</td>
                          <td className="table-td font-medium">{emp.full_name}</td>
                          <td className="table-td">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {emp.department}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent attendance */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Recent Attendance</h2>
                <Link to="/attendance" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {stats.recent_attendance.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No attendance records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-th">Employee</th>
                        <th className="table-th">Date</th>
                        <th className="table-th">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recent_attendance.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                          <td className="table-td font-medium">{rec.employee_name}</td>
                          <td className="table-td text-gray-500">{rec.date}</td>
                          <td className="table-td">
                            <Badge label={rec.status} variant={rec.status.toLowerCase()} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
