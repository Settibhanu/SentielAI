/**
 * SENTINEL SOS — Emergency Map Page
 * Real-time nearby services from OpenStreetMap via Overpass API.
 * Supports a Map view (with absolute sizing wrapper) and an Offline-first List View.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useGeolocation from '../hooks/useGeolocation'
import useAppStore from '../store/useAppStore'
import { getNearbyServices } from '../services/api'
import { estimateETA } from '../utils/offline'

// Fix Leaflet default icon paths in production/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORY_CONFIG = {
  hospital:      { icon: '🏥', color: '#DC2626', label: 'Hospital' },
  ambulance:     { icon: '🚑', color: '#16A34A', label: 'Ambulance' },
  police:        { icon: '👮', color: '#2563EB', label: 'Police' },
  fire_station:  { icon: '🔥', color: '#EA580C', label: 'Fire Station' },
  mechanic:      { icon: '🔧', color: '#7C3AED', label: 'Mechanic' },
  fuel_station:  { icon: '⛽', color: '#CA8A04', label: 'Fuel Station' },
  puncture_shop: { icon: '🔧', color: '#0891B2', label: 'Puncture Shop' },
  towing:        { icon: '🚛', color: '#6B7280', label: 'Towing' },
}

// Fallback coordinate: Chennai, India
const DEFAULT_LAT = 13.0827
const DEFAULT_LON = 80.2707

function createCategoryIcon(category) {
  const cfg = CATEGORY_CONFIG[category] || { icon: '📍', color: '#666' }
  return L.divIcon({
    html: `<div style="
      background:${cfg.color};
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:2px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1">${cfg.icon}</span></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

function createUserIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;border-radius:50%;background:#DC2626;opacity:0.3;animation:pulse 1.5s ease-out infinite"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#DC2626;border:2px solid white;box-shadow:0 0 8px rgba(220,38,38,0.8)"></div>
    </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function MapController({ lat, lon }) {
  const map = useMap()
  const hasFlown = useRef(false)
  
  useEffect(() => {
    if (lat && lon && !hasFlown.current) {
      map.flyTo([lat, lon], 14, { duration: 1.5 })
      hasFlown.current = true
    }
  }, [lat, lon, map])
  
  return null
}

export default function EmergencyMap() {
  const [searchParams] = useSearchParams()
  const { lat, lon, loading: gpsLoading, error: gpsError } = useGeolocation()
  const { activeCategories, toggleCategory, mapRadius, setMapRadius, isOnline } = useAppStore()

  // View state: 'map' or 'list' for offline-friendly rendering
  const [viewMode, setViewMode] = useState('map')
  const [services, setServices] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [bypassedLocating, setBypassedLocating] = useState(false)

  const activeLat = lat || DEFAULT_LAT
  const activeLon = lon || DEFAULT_LON
  const usingFallback = !lat || !lon

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNearbyServices(activeLat, activeLon, mapRadius)
      setServices(data)
      setLastFetch(new Date())
    } catch (err) {
      setError('Unable to query live server. Rendering local offline database cache.')
      console.error('Map fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeLat, activeLon, mapRadius])

  useEffect(() => {
    fetchServices()
  }, [activeLat, activeLon, mapRadius])

  // Handle URL pre-filtering params (e.g. ?category=hospital)
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat && !activeCategories.includes(cat)) {
      toggleCategory(cat)
    }
  }, [searchParams])

  const totalResults = Object.values(services).reduce((sum, arr) => sum + (arr?.length || 0), 0)

  // Flattened results for List View
  const getFlatServices = () => {
    const flatList = []
    Object.entries(services).forEach(([category, list]) => {
      if (!activeCategories.includes(category)) return
      if (!list) return
      list.forEach(item => {
        flatList.push({ ...item, category })
      })
    })
    return flatList.sort((a, b) => a.distance_km - b.distance_km)
  }

  const flatServices = getFlatServices()

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] pb-safe">
      {/* ── Header Controls ── */}
      <div className="shrink-0 bg-[#111111] border-b border-neutral-800 px-4 py-3 z-20">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="font-heading text-xl text-red-500 tracking-wider">🗺️ EMERGENCY SERVICES</h1>
            <p className="text-[10px] text-neutral-500 font-semibold tracking-wide">
              {usingFallback 
                ? `📍 Default: Chennai (India)` 
                : `📍 GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`}
            </p>
          </div>

          {/* Toggle Map / List view */}
          <div className="flex gap-1.5 shrink-0 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider transition-all min-h-[30px] flex items-center gap-1
                ${viewMode === 'map' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider transition-all min-h-[30px] flex items-center gap-1
                ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              📋 List ({flatServices.length})
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter service categories">
          {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
            const count = services[cat]?.length || 0
            const active = activeCategories.includes(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
                aria-label={`${cfg.label}: ${count} found`}
                className={`
                  shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                  border transition-all min-h-[32px]
                  ${active
                    ? 'text-white border-transparent'
                    : 'text-neutral-400 border-neutral-800 bg-transparent'}`}
                style={active ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
              >
                <span aria-hidden="true">{cfg.icon}</span>
                <span>{cfg.label}</span>
                {count > 0 && <span className="opacity-80">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Radius slider & Refresh */}
        <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-neutral-900">
          <span className="text-xs text-neutral-500 shrink-0 uppercase font-heading font-semibold">Radius:</span>
          <input
            type="range"
            min={1000}
            max={20000}
            step={1000}
            value={mapRadius}
            onChange={(e) => setMapRadius(Number(e.target.value))}
            className="flex-1 accent-red-600 cursor-pointer"
            aria-label={`Search radius: ${mapRadius / 1000}km`}
          />
          <span className="text-xs text-neutral-300 font-bold shrink-0 w-12 text-right">
            {(mapRadius / 1000).toFixed(0)} km
          </span>
          <button
            onClick={fetchServices}
            disabled={loading}
            className="shrink-0 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50
                       text-white px-2.5 py-1.5 rounded-lg min-h-[32px] flex items-center font-bold"
            aria-label="Refresh map data"
          >
            🔄 {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Dynamic View Area ── */}
      <div className="flex-1 relative w-full h-full">
        {/* Soft, non-blocking Locating Overlay */}
        {gpsLoading && !lat && !bypassedLocating && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/95 z-40 p-4">
            <div className="card max-w-sm w-full border border-neutral-800 bg-[#111] p-6 text-center space-y-4 shadow-2xl">
              <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="font-heading text-base text-neutral-200 uppercase tracking-wider">Locating Your GPS...</h3>
                <p className="text-xs text-neutral-500 leading-normal">
                  Acquiring direct satellite GPS coordinates. Make sure location services are enabled on your device.
                </p>
              </div>
              <button
                onClick={() => setBypassedLocating(true)}
                className="w-full btn-emergency bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-350 text-xs min-h-[40px] uppercase font-heading font-semibold"
              >
                Skip & Use Default Location (India)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-2 left-2 right-2 z-30 bg-amber-950/80 border border-amber-900/60
                          text-amber-300 text-xs px-3 py-2 rounded-lg shadow-lg">
            ⚠️ {error}
          </div>
        )}

        {/* ── MAP VIEW MODE ── */}
        {viewMode === 'map' && (
          <div className="absolute inset-0 z-10 w-full h-full">
            <MapContainer
              center={[activeLat, activeLon]}
              zoom={usingFallback ? 6 : 14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {!usingFallback && <MapController lat={activeLat} lon={activeLon} />}

              {/* User location dot */}
              {!usingFallback && (
                <>
                  <Marker position={[lat, lon]} icon={createUserIcon()}>
                    <Popup>
                      <div className="text-sm">
                        <strong className="font-heading">📍 You are here</strong>
                        <br />
                        {lat.toFixed(5)}, {lon.toFixed(5)}
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[lat, lon]}
                    radius={mapRadius}
                    pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.05, weight: 1 }}
                  />
                </>
              )}

              {/* Category markers */}
              {Object.entries(services).map(([category, locations]) => {
                if (!activeCategories.includes(category)) return null
                const cfg = CATEGORY_CONFIG[category]
                return locations?.map((loc) => (
                  <Marker
                    key={loc.osm_id}
                    position={[loc.latitude, loc.longitude]}
                    icon={createCategoryIcon(category)}
                  >
                    <Popup maxWidth={280}>
                      <div className="text-sm space-y-1.5 min-w-[200px]">
                        <div className="font-bold font-heading text-base flex items-center gap-1.5">
                          <span>{cfg.icon}</span>
                          <span>{loc.name}</span>
                        </div>
                        <div className="text-neutral-400 text-xs font-semibold">{cfg.label}</div>
                        <div className="flex gap-3 text-xs border-y border-neutral-800/80 py-1">
                          <span className="font-bold text-neutral-300">📏 {loc.distance_km < 1
                            ? `${Math.round(loc.distance_km * 1000)}m`
                            : `${loc.distance_km.toFixed(1)}km`}
                          </span>
                          <span className="font-bold text-emerald-400">⏱ ETA: {estimateETA(loc.distance_km)}</span>
                        </div>
                        {loc.address && (
                          <div className="text-xs text-neutral-400 leading-normal">{loc.address}</div>
                        )}
                        {loc.opening_hours && (
                          <div className="text-xs text-neutral-500">🕐 Hours: {loc.opening_hours}</div>
                        )}
                        <div className="flex gap-2 pt-1 border-t border-neutral-800/60">
                          {loc.phone && (
                            <a
                              href={`tel:${loc.phone}`}
                              className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white
                                         text-xs py-2 rounded-lg font-heading font-semibold min-h-[36px] flex items-center justify-center"
                            >
                              📞 Call
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center bg-red-600 hover:bg-red-500 text-white
                                       text-xs py-2 rounded-lg font-heading font-semibold min-h-[36px] flex items-center justify-center"
                          >
                            🗺️ Navigate
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))
              })}
            </MapContainer>
          </div>
        )}

        {/* ── OFFLINE LIST VIEW MODE ── */}
        {viewMode === 'list' && (
          <div className="absolute inset-0 z-10 w-full h-full overflow-y-auto px-4 py-4 space-y-3 bg-[#0A0A0A]" role="list">
            {!isOnline && (
              <div className="bg-amber-950/20 border border-amber-900/40 p-3.5 rounded-xl text-center">
                <p className="text-amber-400 text-xs">
                  📶 **OFFLINE MODE ACTIVE** — Rendering hospital & rescue coordinates cached in local device storage. Direct calling features work fully offline over standard mobile cellular networks!
                </p>
              </div>
            )}

            {flatServices.length === 0 ? (
              <div className="card text-center p-8 bg-neutral-900/20 border border-neutral-800 rounded-2xl space-y-2">
                <span className="text-3xl block" aria-hidden="true">📭</span>
                <h3 className="font-heading text-neutral-300">No Services Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try widening your search radius or selecting additional category filters above to locate emergency units.
                </p>
              </div>
            ) : (
              flatServices.map((loc, idx) => {
                const cfg = CATEGORY_CONFIG[loc.category] || { icon: '📍', color: '#666', label: 'Service' }
                return (
                  <div
                    key={loc.osm_id || idx}
                    role="listitem"
                    className="card bg-[#111111]/70 border border-neutral-800/80 p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl" aria-hidden="true">{cfg.icon}</span>
                          <h2 className="font-heading text-base text-neutral-200 tracking-wide">
                            {loc.name}
                          </h2>
                        </div>
                        <span className="text-[10px] font-bold font-heading uppercase tracking-widest px-2 py-0.5 rounded border mt-1.5 inline-block"
                              style={{ color: cfg.color, borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}10` }}>
                          {cfg.label}
                        </span>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold font-heading text-neutral-300 block">
                          📏 {loc.distance_km < 1 ? `${Math.round(loc.distance_km * 1000)} m` : `${loc.distance_km.toFixed(1)} km`}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                          ⏱ ETA: {estimateETA(loc.distance_km)}
                        </span>
                      </div>
                    </div>

                    {loc.address && (
                      <p className="text-xs text-neutral-400 leading-normal bg-neutral-950/30 p-2 rounded-lg border border-neutral-850">
                        📍 {loc.address}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1 border-t border-neutral-850">
                      {loc.phone ? (
                        <a
                          href={`tel:${loc.phone}`}
                          className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg font-heading font-semibold min-h-[44px] flex items-center justify-center gap-1"
                        >
                          📞 Call: {loc.phone}
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex-1 text-center bg-neutral-900 border border-neutral-800 text-neutral-500 text-xs py-2 rounded-lg font-heading font-semibold min-h-[44px] cursor-not-allowed"
                        >
                          No Phone Listed
                        </button>
                      )}
                      
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-red-600 hover:bg-red-500 text-white text-xs py-2 rounded-lg font-heading font-semibold min-h-[44px] flex items-center justify-center gap-1"
                      >
                        🗺️ Get Directions
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Summary Status ── */}
      {lastFetch && (
        <div className="shrink-0 bg-[#111111] border-t border-neutral-800 px-4 py-2">
          <p className="text-[10px] text-neutral-500 text-center uppercase tracking-wider font-heading font-semibold">
            OpenStreetMap Data • Cached locally • Updated {lastFetch.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}
