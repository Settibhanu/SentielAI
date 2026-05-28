import React, { useEffect, useState } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import apiClient from '../../api/client'

const SEVERITY_COLORS = {
  minor:   '#facc15',
  serious: '#f97316',
  fatal:   '#ef4444',
}

/**
 * AccidentMarkers — renders historical accident pins on the map.
 * Color-coded by severity: yellow (minor), orange (serious), red (fatal).
 */
export default function AccidentMarkers() {
  const [accidents, setAccidents] = useState([])

  useEffect(() => {
    apiClient.get('/zones/accidents?city=Chennai')
      .then(res => setAccidents(res.data))
      .catch(err => console.error('AccidentMarkers fetch error:', err))
  }, [])

  return accidents.map(acc => (
    <CircleMarker
      key={acc.id}
      center={[acc.lat, acc.lng]}
      radius={5}
      pathOptions={{
        color: SEVERITY_COLORS[acc.severity] ?? '#6b7280',
        fillColor: SEVERITY_COLORS[acc.severity] ?? '#6b7280',
        fillOpacity: 0.8,
      }}
    >
      <Tooltip>
        <span>
          {acc.severity?.toUpperCase()} accident<br />
          {acc.accident_date}<br />
          {acc.weather_condition}
        </span>
      </Tooltip>
    </CircleMarker>
  ))
}
