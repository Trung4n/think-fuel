import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'

function RiskBadge({ risk }) {
  const map = {
    high: 'text-rose-400 border-rose-800 bg-rose-950',
    medium: 'text-amber-400 border-amber-800 bg-amber-950',
    low: 'text-green-400 border-green-800 bg-green-950',
  }
  const cls = map[risk?.toLowerCase()] || 'text-gray-400 border-gray-700'
  return (
    <span className={`text-xs border px-2 py-0.5 rounded capitalize font-mono ${cls}`}>
      {risk || 'N/A'}
    </span>
  )
}

function ScoreCell({ score, invert = false }) {
  const n = Number(score)
  let color = 'text-gray-300'
  if (!isNaN(n)) {
    if (invert) color = n > 60 ? 'text-rose-400' : n > 30 ? 'text-amber-400' : 'text-green-400'
    else color = n >= 60 ? 'text-green-400' : n >= 30 ? 'text-amber-400' : 'text-rose-400'
  }
  return <span className={`font-mono text-sm ${color}`}>{score ?? '—'}</span>
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [dash, setDash] = useState(null)
  const [students, setStudents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [dRes, sRes, aRes] = await Promise.all([
          api.get(`/teachers/${user.id}/dashboard`),
          api.get(`/teachers/${user.id}/students`),
          api.get(`/teachers/${user.id}/alerts`),
        ])
        setDash(dRes.data.data)
        setStudents(sRes.data.data || [])
        setAlerts(aRes.data.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Teacher Dashboard</h1>
        {dash?.className && (
          <p className="text-sm text-gray-400 mt-1">{dash.className}</p>
        )}
      </div>

      {/* Summary cards */}
      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Students', value: dash.totalStudents },
            { label: 'Avg Dependency Score', value: dash.avgDependencyScore },
            { label: 'At-Risk Students', value: dash.atRiskStudents },
            { label: 'Class', value: dash.className || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Students table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-white">Students</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Brain Fuel</th>
                  <th className="text-center px-4 py-2.5 text-xs text-gray-500 font-medium">Dep.</th>
                  <th className="text-center px-4 py-2.5 text-xs text-gray-500 font-medium">Ind.</th>
                  <th className="text-center px-4 py-2.5 text-xs text-gray-500 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-600 text-xs">
                      No students found.
                    </td>
                  </tr>
                )}
                {students.map(s => (
                  <tr key={s.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-3 text-gray-200">{s.name}</td>
                    <td className="px-4 py-3 w-32">
                      <FuelBar fuel={s.brainFuel} maxFuel={1000} showLabel={false} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell score={s.dependencyScore} invert={true} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell score={s.independenceScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RiskBadge risk={s.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-white">
              Alerts
              {alerts.filter(a => !a.isRead).length > 0 && (
                <span className="ml-2 text-xs bg-rose-900 text-rose-300 px-1.5 py-0.5 rounded">
                  {alerts.filter(a => !a.isRead).length}
                </span>
              )}
            </h2>
          </div>
          <div className="overflow-auto max-h-96">
            {alerts.length === 0 && (
              <p className="text-center text-gray-600 text-xs p-6">No alerts.</p>
            )}
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`px-4 py-3 border-b border-gray-800 last:border-0 ${
                  !alert.isRead ? 'bg-gray-800/40' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-amber-400">{alert.type}</span>
                  {!alert.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{alert.message}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
