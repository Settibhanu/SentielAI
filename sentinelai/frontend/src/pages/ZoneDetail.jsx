import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import ApiScoreGauge from '../components/shared/ApiScoreGauge'
import RiskBadge from '../components/shared/RiskBadge'
import FundSourceBadge from '../components/shared/FundSourceBadge'
import apiClient from '../api/client'

const RISK_COLORS = {
  Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444',
}

export default function ZoneDetail() {
  const { id } = useParams()
  const [zone, setZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiClient.get(`/zones/${id}/details`)
      .then(res => setZone(res.data))
      .catch(() => setError('Zone not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-gray-500">Loading zone details…</div>
  if (error || !zone) return (
    <div className="p-6 text-red-400">
      {error ?? 'Zone not found'} — <Link to="/map" className="text-blue-400 underline">Back to map</Link>
    </div>
  )

  const factorData = zone.contributing_factors
    ? Object.entries(zone.contributing_factors).map(([k, v]) => ({
        factor: k.charAt(0).toUpperCase() + k.slice(1),
        value: v,
      }))
    : []

  const forecastDelta = zone.api_score_7day_forecast - zone.api_score

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8" aria-label={`Zone detail: ${zone.zone_name}`}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/map" className="text-xs text-gray-500 hover:text-gray-300">← Back to map</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{zone.zone_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              {zone.road_type}
            </span>
            <RiskBadge category={zone.risk_category} />
          </div>
        </div>
        {/* Dual gauges: current + forecast */}
        <div className="flex gap-6">
          <ApiScoreGauge score={zone.api_score} label="Current Score" />
          <ApiScoreGauge score={zone.api_score_7day_forecast} label="7-day Forecast" size={120} />
        </div>
      </div>

      {/* Forecast card */}
      {forecastDelta > 0 && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-xl p-4 text-sm text-amber-200">
          ⚠ Based on current trends, risk will increase by{' '}
          <strong>+{forecastDelta.toFixed(1)} points</strong> in the next 7 days if unrepaired.
        </div>
      )}

      {/* Road info card */}
      <div className="bg-gray-800 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Road Type</div>
          <div className="text-white font-semibold">{zone.road_type}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Last Relay Date</div>
          <div className="text-white font-semibold">{zone.last_relaying_date ?? 'Unknown'}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Reports (30d)</div>
          <div className="text-white font-semibold">{zone.damage_reports_count}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Accidents (1yr)</div>
          <div className="text-white font-semibold">
            {zone.accident_count_1yr}
            {zone.fatal_count > 0 && (
              <span className="text-red-400 text-xs ml-1">({zone.fatal_count} fatal)</span>
            )}
          </div>
        </div>
      </div>

      {/* Risk breakdown chart */}
      {factorData.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Risk Breakdown</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} layout="vertical">
                <XAxis type="number" domain={[0, 40]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis type="category" dataKey="factor" tick={{ fill: '#d1d5db', fontSize: 12 }} width={90} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {factorData.map((entry, i) => (
                    <Cell key={i} fill={['#ef4444','#f97316','#3b82f6','#8b5cf6'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Repair history */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Repair History</h2>
        <div className="text-sm text-gray-400">
          Repair status: <span className="text-white capitalize">{zone.repair_status ?? 'No repairs recorded'}</span>
        </div>
      </div>
    </main>
  )
}
