/**
 * SENTINEL SOS — Dashboard Page
 * Main emergency action grid + AI triage analyzer.
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useGeolocation from '../hooks/useGeolocation'
import useAppStore from '../store/useAppStore'
import { analyzeEmergency, createSOSEvent } from '../services/api'

const EMERGENCY_CARDS = [
  {
    id: 'accident',
    label: 'ACCIDENT',
    icon: '🚗',
    gradient: 'from-red-900 to-red-700',
    border: 'border-red-700',
    severity: 'critical',
    description: 'Vehicle collision or crash',
  },
  {
    id: 'ambulance',
    label: 'AMBULANCE',
    icon: '🚑',
    gradient: 'from-red-800 to-rose-700',
    border: 'border-rose-700',
    severity: 'critical',
    description: 'Medical emergency',
  },
  {
    id: 'police',
    label: 'POLICE',
    icon: '👮',
    gradient: 'from-blue-900 to-blue-700',
    border: 'border-blue-700',
    severity: 'medium',
    description: 'Law enforcement needed',
  },
  {
    id: 'breakdown',
    label: 'BREAKDOWN',
    icon: '🔧',
    gradient: 'from-orange-900 to-orange-700',
    border: 'border-orange-700',
    severity: 'low',
    description: 'Vehicle won\'t start',
  },
  {
    id: 'flat_tire',
    label: 'FLAT TIRE',
    icon: '🔧',
    gradient: 'from-amber-900 to-amber-700',
    border: 'border-amber-700',
    severity: 'low',
    description: 'Puncture or flat tyre',
  },
  {
    id: 'fuel',
    label: 'NEED FUEL',
    icon: '⛽',
    gradient: 'from-yellow-900 to-yellow-700',
    border: 'border-yellow-700',
    severity: 'low',
    description: 'Out of fuel',
  },
  {
    id: 'medical',
    label: 'MEDICAL',
    icon: '❤️',
    gradient: 'from-red-900 to-pink-800',
    border: 'border-pink-700',
    severity: 'high',
    description: 'Injury or health emergency',
  },
  {
    id: 'fire',
    label: 'FIRE',
    icon: '🔥',
    gradient: 'from-orange-900 to-red-800',
    border: 'border-orange-600',
    severity: 'critical',
    description: 'Vehicle or road fire',
  },
]

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'bg-red-900/30 border-red-700', text: 'text-red-400', label: '🔴 CRITICAL' },
  HIGH:     { bg: 'bg-orange-900/30 border-orange-700', text: 'text-orange-400', label: '🟠 HIGH' },
  MEDIUM:   { bg: 'bg-yellow-900/30 border-yellow-700', text: 'text-yellow-400', label: '🟡 MEDIUM' },
  LOW:      { bg: 'bg-green-900/30 border-green-700', text: 'text-green-400', label: '🟢 LOW' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { lat, lon, loading: gpsLoading, error: gpsError } = useGeolocation()
  const { setActiveSOSEvent, setTriageResult, setNearbyServices, emergencyNumber } = useAppStore()

  const [description, setDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [triageResult, setLocalTriageResult] = useState(null)
  const [activeCard, setActiveCard] = useState(null)
  const [sosLoading, setSosLoading] = useState(null)

  const handleEmergencyCard = useCallback(async (card) => {
    if (!lat || !lon) {
      alert('Getting your location... Please wait a moment and try again.')
      return
    }
    setSosLoading(card.id)
    setActiveCard(card.id)
    try {
      const result = await createSOSEvent(card.id, lat, lon, card.description)
      setActiveSOSEvent(result.event)
      setTriageResult(result.triage)
      setNearbyServices(result.nearby_services)
      navigate(`/map?incident=${card.id}`)
    } catch (err) {
      console.error('SOS creation failed:', err)
      // Navigate to map anyway with category filter
      navigate(`/map?category=${card.id}`)
    } finally {
      setSosLoading(null)
    }
  }, [lat, lon, navigate, setActiveSOSEvent, setTriageResult, setNearbyServices])

  const handleAnalyze = useCallback(async () => {
    if (!description.trim()) return
    if (!lat || !lon) {
      alert('Getting your location... Please wait.')
      return
    }
    setAnalyzing(true)
    setLocalTriageResult(null)
    try {
      const result = await analyzeEmergency(description, lat, lon)
      setLocalTriageResult(result.triage)
      setTriageResult(result.triage)
      setNearbyServices(result.nearby_services)
    } catch (err) {
      console.error('Analysis failed:', err)
      setLocalTriageResult({
        severity: 'MEDIUM',
        call_emergency: false,
        recommendations: ['Unable to analyze — please call 112 if this is an emergency.'],
        required_services: [],
      })
    } finally {
      setAnalyzing(false)
    }
  }, [description, lat, lon, setTriageResult, setNearbyServices])

  const severityStyle = triageResult ? SEVERITY_COLORS[triageResult.severity] : null

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="font-heading text-2xl text-red-500 tracking-wider">🛡 SENTINEL SOS</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {gpsLoading
                ? '📍 Getting location...'
                : gpsError
                ? '⚠️ Location unavailable'
                : lat
                ? `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}`
                : '📍 Locating...'}
            </p>
          </div>
          <a
            href={`tel:${emergencyNumber}`}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white
                       font-heading font-bold text-sm px-3 py-2 rounded-lg min-h-[44px]
                       transition-colors"
            aria-label={`Call emergency number ${emergencyNumber}`}
          >
            📞 {emergencyNumber}
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* ── Emergency Cards Grid ── */}
        <h2 className="font-heading text-lg text-neutral-300 mb-3 tracking-wide uppercase">
          Select Emergency Type
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6" role="list">
          {EMERGENCY_CARDS.map((card) => (
            <button
              key={card.id}
              role="listitem"
              onClick={() => handleEmergencyCard(card)}
              disabled={sosLoading === card.id}
              aria-label={`${card.label} — ${card.description}`}
              className={`
                relative btn-emergency flex-col gap-1 p-4 min-h-[90px]
                bg-gradient-to-br ${card.gradient} border ${card.border}
                text-white shadow-lg
                ${sosLoading === card.id ? 'opacity-70 cursor-wait' : 'hover:brightness-110 active:scale-95'}
                ${activeCard === card.id ? 'ring-2 ring-white' : ''}
              `}
            >
              {sosLoading === card.id ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-3xl" aria-hidden="true">{card.icon}</span>
              )}
              <span className="font-heading text-sm tracking-wider">{card.label}</span>
            </button>
          ))}
        </div>

        {/* ── AI Analyzer ── */}
        <div className="card mb-4">
          <h2 className="font-heading text-base text-neutral-300 mb-2 uppercase tracking-wide">
            🤖 Describe Your Emergency
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 'Car accident, person unconscious, bleeding from head' or 'Flat tire on highway, need help'"
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2
                       text-sm text-neutral-100 placeholder-neutral-600 resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            aria-label="Describe your emergency"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !description.trim()}
            className="mt-2 w-full btn-emergency bg-red-600 hover:bg-red-700 disabled:opacity-50
                       disabled:cursor-not-allowed text-white font-heading"
            aria-label="Analyze emergency with AI"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              '🤖 AI ANALYZE'
            )}
          </button>
        </div>

        {/* ── Triage Result ── */}
        {triageResult && severityStyle && (
          <div
            className={`card border ${severityStyle.bg} mb-4`}
            role="region"
            aria-label="Triage analysis result"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`font-heading text-lg font-bold ${severityStyle.text}`}>
                {severityStyle.label}
              </span>
              {triageResult.call_emergency && (
                <a
                  href={`tel:${emergencyNumber}`}
                  className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg
                             animate-pulse min-h-[36px] flex items-center"
                >
                  🚨 CALL {emergencyNumber}
                </a>
              )}
            </div>

            <ul className="space-y-1.5" aria-label="Recommendations">
              {triageResult.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-300">
                  <span className="text-neutral-500 shrink-0 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            {triageResult.first_aid_topic && (
              <button
                onClick={() => navigate(`/firstaid/${triageResult.first_aid_topic}`)}
                className="mt-3 w-full text-sm text-red-400 hover:text-red-300 underline
                           text-left min-h-[36px] flex items-center"
              >
                📋 View First Aid Guide →
              </button>
            )}

            {Object.keys(useAppStore.getState().nearbyServices).length > 0 && (
              <button
                onClick={() => navigate('/map')}
                className="mt-2 w-full btn-emergency bg-neutral-800 hover:bg-neutral-700
                           text-neutral-200 text-sm min-h-[44px]"
              >
                🗺 View Nearby Services on Map
              </button>
            )}
          </div>
        )}

        {/* ── Quick Info ── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: '🗺', label: 'Emergency Map', path: '/map' },
            { icon: '📋', label: 'First Aid', path: '/firstaid' },
            { icon: '👤', label: 'My Contacts', path: '/contacts' },
          ].map(({ icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="card flex flex-col items-center gap-1.5 py-3 hover:bg-neutral-800
                         transition-colors min-h-[70px]"
              aria-label={label}
            >
              <span className="text-xl" aria-hidden="true">{icon}</span>
              <span className="text-xs text-neutral-400 text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
