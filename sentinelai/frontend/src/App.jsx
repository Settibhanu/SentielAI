import React, { useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Report from './pages/Report'
import Heatmap from './pages/Heatmap'
import Authority from './pages/Authority'
import ZoneDetail from './pages/ZoneDetail'
import Community from './pages/Community'
import OfflineBanner from './components/shared/OfflineBanner'
import CountrySelector from './components/shared/CountrySelector'
import ChatbotWidget from './components/chatbot/ChatbotWidget'
import PwaInstallPrompt from './components/shared/PwaInstallPrompt'
import useAppStore from './store/useAppStore'
import { syncPendingReports } from './lib/offlineQueue'
import apiClient from './api/client'

// ── Mobile bottom nav items ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/map',       label: 'nav_heatmap',  icon: MapIcon },
  { to: '/report',    label: 'nav_report',   icon: ReportIcon },
  { to: '/authority', label: 'nav_authority',icon: AuthIcon },
  { to: '/community', label: 'nav_community',icon: CommunityIcon },
]

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}
function ReportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}
function AuthIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
function CommunityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export default function App() {
  const { t, i18n } = useTranslation()
  const { setOnline, refreshPendingCount } = useAppStore()
  const location = useLocation()

  // Track online/offline + auto-sync
  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true)
      try {
        const result = await syncPendingReports(apiClient)
        if (result.synced > 0) console.log(`[Sync] ${result.synced} report(s) uploaded`)
      } catch (_) {}
      refreshPendingCount()
    }
    const handleOffline = () => { setOnline(false); refreshPendingCount() }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    refreshPendingCount()
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <OfflineBanner />

      {/* ── Desktop top nav (hidden on mobile) ── */}
      <nav
        className="hidden sm:flex bg-gray-900 border-b border-gray-800 px-4 py-0
                   items-center gap-1 sticky top-0 z-40"
        role="navigation"
        aria-label="Main navigation"
      >
        <span className="text-base font-bold text-emerald-400 tracking-tight mr-3 py-3" aria-label="SentinelAI">
          🛡 SentinelAI
        </span>

        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `text-sm font-medium min-h-[44px] flex items-center px-3 rounded transition-colors
               ${isActive ? 'text-emerald-400 bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`
            }
            aria-label={t(label)}
          >
            {t(label)}
          </NavLink>
        ))}

        <div className="ml-auto flex items-center gap-2 py-2">
          <select
            value={i18n.language.startsWith('hi') ? 'hi' : 'en'}
            onChange={e => i18n.changeLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1
                       min-h-[36px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="hi">हि</option>
          </select>
          <CountrySelector />
        </div>
      </nav>

      {/* ── Mobile top header ── */}
      <header
        className="sm:hidden flex items-center justify-between px-4 py-3
                   bg-gray-900 border-b border-gray-800 sticky top-0 z-40"
      >
        <span className="text-base font-bold text-emerald-400">🛡 SentinelAI</span>
        <div className="flex items-center gap-2">
          <select
            value={i18n.language.startsWith('hi') ? 'hi' : 'en'}
            onChange={e => i18n.changeLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1
                       min-h-[36px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="hi">हि</option>
          </select>
          <CountrySelector />
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 pb-16 sm:pb-0">
        <Routes>
          <Route path="/"          element={<Heatmap />} />
          <Route path="/map"       element={<Heatmap />} />
          <Route path="/report"    element={<Report />} />
          <Route path="/authority" element={<Authority />} />
          <Route path="/zone/:id"  element={<ZoneDetail />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </main>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40
                   bg-gray-900 border-t border-gray-800 flex"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]
               transition-colors text-xs font-medium
               ${isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`
            }
            aria-label={t(label)}
          >
            <Icon />
            <span className="text-[10px]">{t(label)}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Global chatbot widget (all pages) ── */}
      <ChatbotWidget />

      {/* ── PWA install prompt ── */}
      <PwaInstallPrompt />
    </div>
  )
}
