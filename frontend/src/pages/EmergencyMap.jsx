/**
 * SENTINEL SOS — Emergency Map Page
 * Real-time nearby services from OpenStreetMap via Overpass API.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useGeolocation from '../hooks/useGeolocation'
import useAppStore from '../store/useAppStore'
import { getNearbyServices } from '../services/api'
import { estimateETA } from '../utils/offline'

// Fix Leaflet default icon
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
  const { lat, lon, loading: gpsLoading } = useGeolocation()
  const { activeCategories, toggleCategory, mapRadius, setMapRadius, isOnline } = useAppStore()

  const [services, setServices] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const fetchServices = useCallback(async () => {
    if (!lat || !lon) return
    setLoading(true)
    setError(null)
    try {
      const data = await getNearbyServices(lat, lon, mapRadius)
      setServices(data)
      setLastFetch(new Date())
    } catch (err) {
      setError('Unable to fetch services. Showing cached data if available.')
      console.error('Map fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [lat, lon, mapRadius])

  useEffect(() => {
    if (lat && lon) fetchServices()
  }, [lat, lon, mapRadius])

  // Handle URL params (e.g. ?category=hospital from dashboard)
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat && !activeCategories.includes(cat)) {
      toggleCategory(cat)
    }
  }, [searchParams])

  const totalResults = Object.values(services).reduce((sum, arr) => sum + (arr?.length || 0), 0)

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      {/* ── Header ── */}
      <div className="shrink-0 bg-[#111] border-b border-neutral-800 px-4 py-3 z-20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-xl text-red-500 tracking-wider">🗺 EMERGENCY MAP</h1>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            )}
            {!isOnline && (
              <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">
                Offline
              </span>
            )}
            <span className="text-xs text-neutral-500">
              {totalResults} found
            </span>
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
                  shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium
                  border transition-all min-h-[32px]
                  ${active
                    ? 'text-white border-transparent'
                    : 'text-neutral-500 border-neutral-700 bg-transparent'}
                `}
                style={active ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
              >
                <span aria-hidden="true">{cfg.icon}</span>
                <span>{cfg.label}</span>
                {count > 0 && <span className="opacity-80">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Radius slider */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-neutral-500 shrink-0">Radius:</span>
          <input
            type="range"
            min={1000}
            max={20000}
            step={1000}
            value={mapRadius}
            onChange={(e) => setMapRadius(Number(e.target.value))}
            className="flex-1 accent-red-600"
            aria-label={`Search radius: ${mapRadius / 1000}km`}
          />
          <span className="text-xs text-neutral-300 shrink-0 w-12 text-right">
            {mapRadius / 1000}km
          </span>
          <button
            onClick={fetchServices}
            disabled={loading || !lat}
            className="shrink-0 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50
                       text-white px-2.5 py-1.5 rounded-lg min-h-[32px]"
            aria-label="Refresh map data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {gpsLoading && !lat && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A] z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">Getting your location...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-2 left-2 right-2 z-10 bg-amber-900/80 border border-amber-700
                          text-amber-200 text-xs px-3 py-2 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <MapContainer
          center={lat && lon ? [lat, lon] : [20.5937, 78.9629]}
          zoom={lat && lon ? 14 : 5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {lat && lon && <MapController lat={lat} lon={lon} />}

          {/* User location */}
          {lat && lon && (
            <>
              <Marker position={[lat, lon]} icon={createUserIcon()}>
                <Popup>
                  <div className="text-sm">
                    <strong>📍 Your Location</strong>
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

          {/* Service markers */}
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
                    <div className="font-bold text-base flex items-center gap-1.5">
                      <span>{cfg.icon}</span>
                      <span>{loc.name}</span>
                    </div>
                    <div className="text-neutral-400 text-xs">{cfg.label}</div>
                    <div className="flex gap-3 text-xs">
                      <span>📏 {loc.distance_km < 1
                        ? `${Math.round(loc.distance_km * 1000)}m`
                        : `${loc.distance_km.toFixed(1)}km`}
                      </span>
                      <span>⏱ {estimateETA(loc.distance_km)}</span>
                    </div>
                    {loc.address && (
                      <div className="text-xs text-neutral-400 truncate">{loc.address}</div>
                    )}
                    {loc.opening_hours && (
                      <div className="text-xs text-neutral-400">🕐 {loc.opening_hours}</div>
                    )}
                    <div className="flex gap-2 pt-1">
                      {loc.phone && (
                        <a
                          href={`tel:${loc.phone}`}
                          className="flex-1 text-center bg-green-700 hover:bg-green-600 text-white
                                     text-xs py-1.5 rounded font-medium"
                        >
                          📞 Call
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-blue-700 hover:bg-blue-600 text-white
                                   text-xs py-1.5 rounded font-medium"
                      >
                        🗺 Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))
          })}
        </MapContainer>
      </div>

      {/* ── Bottom summary ── */}
      {lastFetch && (
        <div className="shrink-0 bg-[#111] border-t border-neutral-800 px-4 py-2">
          <p className="text-xs text-neutral-500 text-center">
            Data from OpenStreetMap · Updated {lastFetch.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}
