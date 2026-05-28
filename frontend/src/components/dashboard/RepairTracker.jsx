import React, { useEffect, useState } from 'react'
import apiClient from '../../api/client'

const COLUMNS = ['pending', 'assigned', 'in_progress', 'completed', 'verified']

const COLUMN_LABELS = {
  pending:     'Pending',
  assigned:    'Assigned',
  in_progress: 'In Progress',
  completed:   'Completed',
  verified:    'Verified',
}

/**
 * RepairTracker — Kanban board showing repair status across all zones.
 * Columns: Pending → Assigned → In Progress → Completed → Verified
 */
export default function RepairTracker() {
  const [repairs, setRepairs] = useState([])

  useEffect(() => {
    apiClient.get('/dashboard/repairs')
      .then(res => setRepairs(res.data))
      .catch(err => console.error('RepairTracker fetch error:', err))
  }, [])

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = repairs.filter(r => r.status === col)
    return acc
  }, {})

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3">Repair Tracker</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {COLUMNS.map(col => (
          <div key={col} className="bg-gray-800 rounded-xl p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {COLUMN_LABELS[col]}
              <span className="ml-1 text-gray-500">({byStatus[col].length})</span>
            </div>
            {byStatus[col].map(r => (
              <div key={r.id} className="bg-gray-700 rounded-lg p-2 text-xs text-gray-200 space-y-1">
                <div className="font-medium">{r.zone_name}</div>
                {r.contractor && <div className="text-gray-400">{r.contractor}</div>}
                {r.estimated_completion && (
                  <div className="text-gray-500">ETA: {r.estimated_completion}</div>
                )}
              </div>
            ))}
            {byStatus[col].length === 0 && (
              <div className="text-gray-600 text-xs italic">No items</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
