import React, { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../api/client'
import useAppStore from '../../store/useAppStore'

const RISK_COLORS = {
  Low:      '#22c55e',
  Medium:   '#eab308',
  High:     '#f97316',
  Critical: '#ef4444',
}

function zoneStyle(feature) {
  const color = RISK_COLORS[feature.properties?.risk_category] ?? '#6b7280'
  return { fillColor: color, fillOpacity: 0.45, color, weight: 1.5 }
}

/**
 * ZoneLayer — color-coded zone polygons with popup showing:
 * API Score, risk, road type, last relay date, 7-day forecast.
 */
export default function ZoneLayer({ showForecast }) {
  const [zones, setZones] = useState(null)
  const { filters, countryCode } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    apiClient.get(`/zones/heatmap?city=${filters.city}&country=${countryCode}`)
      .then(res => setZones(res.data))
      .catch(err => console.error('ZoneLayer:', err))
  }, [filters.city, countryCode])

  if (!zones) return null

  // Apply risk/road type filters
  const filtered = {
    ...zones,
    features: zones.features.filter(f => {
      const p = f.properties
      if (filters.riskLevel !== 'all' && p.risk_category !== filters.riskLevel) return false
      if (filters.roadType !== 'all' && p.road_type !== filters.roadType) return false
      return true
    }),
  }

  return (
    <GeoJSON
      key={JSON.stringify(filters) + showForecast}
      data={filtered}
      style={feature => {
        if (showForecast) {
          // Shade by forecast score
          const score = feature.properties?.api_score_7day_forecast ?? 0
          const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e'
          return { fillColor: color, fillOpacity: 0.55, color, weight: 1.5 }
        }
        return zoneStyle(feature)
      }}
      onEachFeature={(feature, layer) => {
        const p = feature.properties
        const scoreDisplay = showForecast
          ? `<b>${p.api_score_7day_forecast}</b> <span style="font-size:10px;color:#9ca3af">(7-day forecast)</span>`
          : `<b>${p.api_score}</b>`

        layer.bindPopup(`
          <div style="min-width:200px;font-family:sans-serif;font-size:13px">
            <div style="font-weight:600;margin-bottom:4px">${p.zone_name ?? 'Zone'}</div>
            <div>Road type: <b>${p.road_type ?? '—'}</b></div>
            <div>API Score: ${scoreDisplay}</div>
            <div>Risk: <b style="color:${RISK_COLORS[p.risk_category]}">${p.risk_category ?? '—'}</b></div>
            <div>Reports: ${p.damage_reports_count ?? 0}</div>
            <div>Last relay: ${p.last_relaying_date ?? 'Unknown'}</div>
            <div style="margin-top:6px">
              <a href="/zone/${p.zone_id}" style="color:#34d399;text-decoration:underline">
                View details →
              </a>
            </div>
          </div>
        `)
      }}
    />
  )
}
