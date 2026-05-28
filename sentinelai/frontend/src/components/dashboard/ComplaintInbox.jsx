import React, { useEffect, useState } from 'react'
import apiClient from '../../api/client'

function slaStatus(complaint) {
  if (complaint.sla_breached) return { label: 'SLA Breached', cls: 'text-red-400' }
  if (complaint.escalation_level > 0) return { label: `Escalated L${complaint.escalation_level}`, cls: 'text-orange-400' }
  if (complaint.acknowledged_at) return { label: 'Acknowledged', cls: 'text-emerald-400' }
  return { label: 'Pending', cls: 'text-yellow-400' }
}

/**
 * ComplaintInbox — shows routed complaints with EE, SLA deadline, escalation level.
 */
export default function ComplaintInbox() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/dashboard/complaints')
      .then(res => setComplaints(res.data))
      .catch(err => console.error('ComplaintInbox:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3">Complaint Inbox</h2>
      <div className="space-y-3">
        {complaints.map(c => {
          const { label, cls } = slaStatus(c)
          return (
            <div
              key={c.id}
              className="bg-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 space-y-1">
                <div className="font-medium text-white">{c.zone_name}</div>
                <div className="text-xs text-gray-400">
                  Road type: <span className="text-gray-200">{c.road_type}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Routed to: <span className="text-emerald-300">{c.routed_to}</span>
                </div>
                <div className="text-xs text-gray-400">
                  📞 <a href={`tel:${c.ee_phone}`} className="text-blue-400 hover:underline">{c.ee_phone}</a>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className={`text-sm font-semibold ${cls}`}>{label}</div>
                <div className="text-xs text-gray-500">
                  SLA: {c.sla_deadline ? new Date(c.sla_deadline).toLocaleDateString() : '—'}
                </div>
                {c.escalation_level > 0 && (
                  <div className="text-xs text-orange-400">
                    Escalation level {c.escalation_level}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {complaints.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-4">No complaints in inbox</div>
        )}
      </div>
    </div>
  )
}
