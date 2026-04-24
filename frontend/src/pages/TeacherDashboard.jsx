import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'

function RiskBadge({ risk }) {
  const map = {
    high: { color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
    medium: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    low: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  }
  const s = map[risk?.toLowerCase()] || { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' }
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {risk || 'N/A'}
    </span>
  )
}

function ScoreCell({ score, invert = false }) {
  const n = Number(score)
  let color = '#374151'
  if (!isNaN(n)) {
    if (invert) color = n > 60 ? '#E11D48' : n > 30 ? '#D97706' : '#059669'
    else color = n >= 60 ? '#059669' : n >= 30 ? '#D97706' : '#E11D48'
  }
  return <span className="font-mono text-sm font-semibold" style={{ color }}>{score ?? '—'}</span>
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
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    )
  }

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Analytics</h1>
        {dash?.className && (
          <p className="text-sm text-gray-500 mt-1">{dash.className} — Progress & Early Alerts</p>
        )}
      </div>

      {/* Summary cards */}
      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Students', value: dash.totalStudents, color: '#3B82F6' },
            { label: 'Avg Dependency', value: dash.avgDependencyScore, color: '#E11D48' },
            { label: 'At-Risk Students', value: dash.atRiskStudents, color: '#F59E0B' },
            { label: 'Class', value: dash.className || '—', color: '#14B8A6' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4">
              <div className="text-2xl font-bold mb-1" style={{ color }}>{value ?? '—'}</div>
              <div className="text-xs font-medium text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Students table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Students</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Name', 'Brain Fuel', 'Dep.', 'Ind.', 'Risk'].map((h, i) => (
                    <th key={h}
                      className={`${i > 1 ? 'text-center' : 'text-left'} px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">
                      No students found.
                    </td>
                  </tr>
                )}
                {students.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 w-36">
                      <FuelBar fuel={s.brainFuel} maxFuel={1000} showLabel={false} />
                    </td>
                    <td className="px-4 py-3 text-center"><ScoreCell score={s.dependencyScore} invert={true} /></td>
                    <td className="px-4 py-3 text-center"><ScoreCell score={s.independenceScore} /></td>
                    <td className="px-4 py-3 text-center"><RiskBadge risk={s.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Alerts</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="overflow-auto max-h-96">
            {alerts.length === 0 && (
              <p className="text-center text-gray-400 text-xs p-6">No alerts.</p>
            )}
            {alerts.map((alert, i) => (
              <div key={i}
                className="px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors"
                style={{ background: !alert.isRead ? '#FFFBEB' : 'transparent' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: '#D97706' }}>{alert.type}</span>
                  {!alert.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#E11D48' }} />
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-1">
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
