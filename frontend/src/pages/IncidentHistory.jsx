/**
 * SENTINEL SOS — Incident History Page
 * View past triggered SOS events, their status, triage findings, and locations.
 */
import React, { useState, useEffect } from 'react'
import { getIncidentHistory, resolveIncident } from '../services/api'

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locations, setLocations] = useState({}) // Cached geocoded address strings

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await getIncidentHistory()
      setIncidents(data)
      setError(null)
      
      // Proactively geocode unique coordinates
      data.forEach(inc => {
        geocodeLocation(inc.id, inc.latitude, inc.longitude)
      })
    } catch (err) {
      console.error('Failed to load incident history:', err)
      setError('Could not retrieve incident history.')
    } finally {
      setLoading(false)
    }
  }

  // Reverse geocoding helper via Nominatim
  const geocodeLocation = async (id, lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SENTINEL-SOS-IITM-Hackathon'
        }
      })
      if (res.ok) {
        const data = await res.json()
        const address = data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        setLocations(prev => ({ ...prev, [id]: address }))
      } else {
        setLocations(prev => ({ ...prev, [id]: `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}` }))
      }
    } catch (err) {
      setLocations(prev => ({ ...prev, [id]: `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}` }))
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // Resolve active incident
  const handleResolve = async (id) => {
    if (!window.confirm('Do you want to mark this incident as RESOLVED?')) return
    try {
      await resolveIncident(id)
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'resolved', resolved_at: new Date().toISOString() } : inc))
    } catch (err) {
      console.error('Failed to resolve incident:', err)
      alert('Failed to update incident. Please try again.')
    }
  }

  const severityColors = {
    CRITICAL: 'text-red-400 bg-red-950/40 border-red-800/60',
    HIGH: 'text-orange-400 bg-orange-950/40 border-orange-800/60',
    MEDIUM: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/60',
    LOW: 'text-green-400 bg-green-950/40 border-green-800/60',
  }

  const statusColors = {
    active: 'bg-red-550/20 text-red-500 border-red-500/30 animate-pulse',
    resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  }

  const getIncidentIcon = (type) => {
    const icons = {
      accident: '🚗',
      ambulance: '🚑',
      police: '👮',
      breakdown: '🔧',
      flat_tire: '🔧',
      fuel: '⛽',
      medical: '❤️',
      fire: '🔥',
    }
    return icons[type] || '🚨'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-red-500 tracking-wider">📋 INCIDENT HISTORY</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Log and timeline of past emergency events</p>
        </div>
        <button
          onClick={loadHistory}
          className="text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 px-3.5 py-1.5 rounded-lg min-h-[40px] transition-colors active:scale-95 flex items-center gap-1 text-neutral-400 hover:text-white"
          aria-label="Refresh list"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-neutral-500 font-heading text-sm tracking-wider">RETRIEVING HISTORY LOGS...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={loadHistory}
              className="mt-3 text-xs bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700 font-semibold"
            >
              🔄 Retry Load
            </button>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-8 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-center space-y-3">
            <span className="text-4xl block" aria-hidden="true">🛡️</span>
            <h2 className="font-heading text-lg text-neutral-300">Clean History Log</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No emergency events have been triggered yet. When you raise an SOS, its details will appear here as a persistent record.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-neutral-800 ml-4 pl-6 space-y-6">
            {incidents.map((incident) => {
              const dateStr = new Date(incident.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div key={incident.id} className="relative group">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-750 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                    {getIncidentIcon(incident.incident_type)}
                  </span>

                  {/* Card */}
                  <div className="card space-y-3 bg-neutral-900/45 hover:bg-neutral-900/70 border border-neutral-800 transition-colors">
                    {/* Upper row */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase block tracking-wider">
                          {dateStr}
                        </span>
                        <h2 className="font-heading text-lg text-neutral-200 tracking-wide mt-0.5 uppercase">
                          {incident.incident_type.replace('_', ' ')}
                        </h2>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex gap-1.5 items-center">
                        <span className={`text-[10px] font-bold font-heading px-2 py-0.5 rounded border uppercase
                          ${severityColors[incident.severity] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                          {incident.severity}
                        </span>
                        <span className={`text-[10px] font-bold font-heading px-2 py-0.5 rounded border uppercase
                          ${statusColors[incident.status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>

                    {/* Geocoded Address */}
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5 bg-neutral-950/40 p-2 rounded-lg border border-neutral-850">
                      <span className="text-neutral-500">📍</span>
                      <span className="truncate">
                        {locations[incident.id] || `Geocoding: ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                      </span>
                    </div>

                    {/* Description */}
                    {incident.description && (
                      <p className="text-xs text-neutral-300 italic bg-[#0F0F0F]/60 p-2.5 rounded-lg border border-neutral-850 leading-relaxed">
                        "{incident.description}"
                      </p>
                    )}

                    {/* Lower Row / Action to resolve */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500">
                        ID: {String(incident.id).slice(0, 8)}...
                      </span>

                      {incident.status === 'active' && (
                        <button
                          onClick={() => handleResolve(incident.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-semibold text-xs tracking-wider
                                     px-3 py-1.5 rounded-lg min-h-[36px] transition-colors active:scale-95 flex items-center gap-1"
                          aria-label={`Mark incident ${incident.id} as resolved`}
                        >
                          ✓ Mark Resolved
                        </button>
                      )}
                      
                      {incident.resolved_at && (
                        <span className="text-[10px] text-emerald-500 italic">
                          Resolved at: {new Date(incident.resolved_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
