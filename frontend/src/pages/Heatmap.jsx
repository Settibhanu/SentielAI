import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LeafletMap from '../components/map/LeafletMap'
import ZoneLayer from '../components/map/ZoneLayer'
import AccidentMarkers from '../components/map/AccidentMarkers'
import useAppStore from '../store/useAppStore'

const CITIES = ['Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad']
const RISK_LEVELS = ['all', 'Low', 'Medium', 'High', 'Critical']
const ROAD_TYPES = ['all', 'NH', 'SH', 'MDR', 'Urban', 'Local']

const CITY_CENTERS = {
  Bengaluru:  [12.9716, 77.5946],
  Chennai:    [13.0827, 80.2707],
  Mumbai:     [19.0760, 72.8777],
  Delhi:      [28.6139, 77.2090],
  Hyderabad:  [17.3850, 78.4867],
}

const RISK_COLORS = {
  Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444',
}

export default function Heatmap() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { filters, setFilter } = useAppStore()
  const [showForecast, setShowForecast] = useState(false)
  const [showAccidents, setShowAccidents] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const center = CITY_CENTERS[filters.city] ?? [12.9716, 77.5946]

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] sm:h-[calc(100vh-56px)] relative">

      {/* ── Desktop filter bar ── */}
      <div
        className="hidden sm:flex bg-gray-900 border-b border-gray-800 px-4 py-2
                   flex-wrap gap-3 items-center text-sm"
        role="toolbar"
        aria-label="Map filters"
      >
        <FilterControls
          filters={filters} setFilter={setFilter}
          showForecast={showForecast} setShowForecast={setShowForecast}
          showAccidents={showAccidents} setShowAccidents={setShowAccidents}
          t={t}
        />
        <RiskLegend />
      </div>

      {/* ── Mobile filter toggle button ── */}
      <div className="sm:hidden flex items-center justify-between px-3 py-2
                      bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => setFilterOpen(v => !v)}
          className="flex items-center gap-2 text-xs text-gray-300 bg-gray-800
                     border border-gray-700 px-3 py-2 rounded-lg min-h-[36px]"
          aria-expanded={filterOpen}
          aria-label="Toggle map filters"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
          {(filters.riskLevel !== 'all' || filters.roadType !== 'all') && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          )}
        </button>
        <RiskLegend compact />
      </div>

      {/* ── Mobile collapsible filter drawer ── */}
      {filterOpen && (
        <div className="sm:hidden bg-gray-900 border-b border-gray-800 px-3 py-3 space-y-3">
          <FilterControls
            filters={filters} setFilter={setFilter}
            showForecast={showForecast} setShowForecast={setShowForecast}
            showAccidents={showAccidents} setShowAccidents={setShowAccidents}
            t={t} mobile
          />
        </div>
      )}

      {/* ── Full-height map ── */}
      <div className="flex-1 relative" role="main" aria-label="Road risk heatmap">
        <LeafletMap center={center} zoom={12}>
          <ZoneLayer showForecast={showForecast} />
          {showAccidents && <AccidentMarkers />}
        </LeafletMap>
      </div>

      {/* ── Floating "Report Issue" FAB (mobile) ── */}
      <button
        onClick={() => navigate('/report')}
        className="sm:hidden fixed bottom-20 left-4 z-30
                   bg-red-600 hover:bg-red-700 active:scale-95 text-white
                   flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
                   shadow-red-900/50 transition-all min-h-[44px] text-sm font-semibold"
        aria-label="Report road damage"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Report Issue
      </button>
    </div>
  )
}

// ── Shared filter controls ────────────────────────────────────────────────────
function FilterControls({ filters, setFilter, showForecast, setShowForecast,
                          showAccidents, setShowAccidents, t, mobile }) {
  const selectCls = `bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1.5
                     min-h-[36px] focus:outline-none focus:ring-2 focus:ring-emerald-500
                     ${mobile ? 'w-full' : ''}`

  return (
    <>
      <label className={`flex items-center gap-1.5 text-gray-400 text-xs ${mobile ? 'flex-col items-start' : ''}`}>
        {t('map_filter_city')}
        <select value={filters.city} onChange={e => setFilter('city', e.target.value)}
                className={selectCls} aria-label={t('map_filter_city')}>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </label>

      <label className={`flex items-center gap-1.5 text-gray-400 text-xs ${mobile ? 'flex-col items-start' : ''}`}>
        {t('map_filter_risk')}
        <select value={filters.riskLevel} onChange={e => setFilter('riskLevel', e.target.value)}
                className={selectCls} aria-label={t('map_filter_risk')}>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r === 'all' ? t('map_all') : r}</option>)}
        </select>
      </label>

      <label className={`flex items-center gap-1.5 text-gray-400 text-xs ${mobile ? 'flex-col items-start' : ''}`}>
        {t('map_filter_road')}
        <select value={filters.roadType} onChange={e => setFilter('roadType', e.target.value)}
                className={selectCls} aria-label={t('map_filter_road')}>
          {ROAD_TYPES.map(r => <option key={r} value={r}>{r === 'all' ? t('map_all') : r}</option>)}
        </select>
      </label>

      <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer select-none min-h-[36px]">
        <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)}
               className="accent-emerald-500 w-4 h-4" aria-label={t('map_forecast_toggle')} />
        {t('map_forecast_toggle')}
      </label>

      <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer select-none min-h-[36px]">
        <input type="checkbox" checked={showAccidents} onChange={e => setShowAccidents(e.target.checked)}
               className="accent-emerald-500 w-4 h-4" aria-label={t('map_accidents_toggle')} />
        {t('map_accidents_toggle')}
      </label>
    </>
  )
}

function RiskLegend({ compact }) {
  const items = [['#22c55e','Low'],['#eab308','Med'],['#f97316','High'],['#ef4444','Crit']]
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {items.map(([c, l]) => (
          <span key={l} className="flex items-center gap-0.5 text-[10px] text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  )
}
