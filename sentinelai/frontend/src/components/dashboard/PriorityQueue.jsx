import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RiskBadge from '../shared/RiskBadge'
import apiClient from '../../api/client'

function fmt(n) {
  if (!n) return '—'
  return '₹' + Number(n).toLocaleString('en-IN')
}

/**
 * PriorityQueue — zones ranked by API Score with road type, last relay date,
 * repair cost estimate, and lives-at-risk indicator.
 */
export default function PriorityQueue() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    apiClient.get('/dashboard/priority-queue')
      .then(res => setZones(res.data))
      .catch(err => console.error('PriorityQueue:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3">{t('authority_priority')}</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm text-left" aria-label="Priority repair queue">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Road</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Accidents</th>
              <th className="px-4 py-3">Last Relay</th>
              <th className="px-4 py-3">Est. Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {zones.map(zone => (
              <tr key={zone.zone_id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{zone.zone_name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                    {zone.road_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-red-400">{zone.api_score}</td>
                <td className="px-4 py-3"><RiskBadge category={zone.risk_category} /></td>
                <td className="px-4 py-3 text-gray-300">{zone.damage_reports_count}</td>
                <td className="px-4 py-3 text-gray-300">{zone.accident_count_1yr}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{zone.last_relaying_date ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{fmt(zone.repair_cost_estimate_inr)}</td>
                <td className="px-4 py-3 capitalize text-gray-400 text-xs">{zone.repair_status ?? 'pending'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/zone/${zone.zone_id}`)}
                    className="text-blue-400 hover:text-blue-300 text-xs underline min-h-[44px] px-1"
                    aria-label={`View details for ${zone.zone_name}`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
