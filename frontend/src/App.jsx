import React, { useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Dashboard from './pages/Dashboard'
import EmergencyMap from './pages/EmergencyMap'
import SOSAssistant from './pages/SOSAssistant'
import FirstAid from './pages/FirstAid'
import EmergencyContacts from './pages/EmergencyContacts'
import IncidentHistory from './pages/IncidentHistory'
import Profile from './pages/Profile'
import OfflineBanner from './components/shared/OfflineBanner'
import PwaInstallPrompt from './components/shared/PwaInstallPrompt'
import ChatbotWidget from './components/chatbot/ChatbotWidget'
import useAppStore from './store/useAppStore'

// ── Icons ───────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function FirstAidIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}
function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// ── Navigation Configuration ────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/',             label: 'nav_home',     icon: HomeIcon },
  { to: '/map',          label: 'nav_map',      icon: MapIcon },
  { to: '/chat',         label: 'nav_chat',     icon: ChatIcon },
  { to: '/firstaid',     label: 'nav_firstaid', icon: FirstAidIcon },
  { to: '/profile',      label: 'nav_profile',  icon: ProfileIcon },
]

export default function App() {
  const { t, i18n } = useTranslation()
  const { userId, setUserId, setOnline } = useAppStore()

  // Ensure persistent user scoping
  useEffect(() => {
    if (!userId) {
      const newId = crypto.randomUUID ? crypto.randomUUID() : '3eb634de-c866-4190-b18c-8cb0b60b299e'
      setUserId(newId)
    }
  }, [userId, setUserId])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100 flex flex-col">
      <OfflineBanner />

      {/* ── Desktop Top Nav (hidden on mobile) ── */}
      <nav
        className="hidden sm:flex bg-[#111111] border-b border-neutral-800 px-4 py-0
                   items-center gap-1 sticky top-0 z-40"
        role="navigation"
        aria-label="Main navigation"
      >
        <span className="text-base font-bold text-red-500 tracking-wider mr-4 py-3 font-heading" aria-label="SENTINEL SOS">
          🛡 SENTINEL SOS
        </span>

        <div className="flex gap-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-heading font-semibold tracking-wide min-h-[44px] flex items-center px-3.5 rounded-lg transition-colors
                 ${isActive ? 'text-red-500 bg-neutral-900 border border-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`
              }
              aria-label={t(label)}
            >
              {t(label)}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 py-2">
          {/* Quick link shortcuts */}
          <NavLink
            to="/contacts"
            className="text-xs text-neutral-400 hover:text-white underline min-h-[36px] flex items-center"
          >
            Contacts
          </NavLink>
          <NavLink
            to="/incidents"
            className="text-xs text-neutral-400 hover:text-white underline min-h-[36px] flex items-center"
          >
            History
          </NavLink>

          <select
            value={i18n.language.startsWith('hi') ? 'hi' : 'en'}
            onChange={e => i18n.changeLanguage(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2.5 py-1
                       min-h-[36px] focus:outline-none focus:ring-1 focus:ring-red-600"
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="hi">हि</option>
          </select>
        </div>
      </nav>

      {/* ── Mobile Top Header ── */}
      <header
        className="sm:hidden flex items-center justify-between px-4 py-3
                   bg-[#111111] border-b border-neutral-800 sticky top-0 z-40"
      >
        <span className="text-base font-bold text-red-500 font-heading tracking-wider">🛡 SENTINEL SOS</span>
        <div className="flex items-center gap-2">
          <select
            value={i18n.language.startsWith('hi') ? 'hi' : 'en'}
            onChange={e => i18n.changeLanguage(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2 py-1
                       min-h-[36px] focus:outline-none focus:ring-1 focus:ring-red-600"
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="hi">हि</option>
          </select>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 pb-20 sm:pb-0">
        <Routes>
          <Route path="/"                   element={<Dashboard />} />
          <Route path="/map"                element={<EmergencyMap />} />
          <Route path="/chat"               element={<SOSAssistant />} />
          <Route path="/firstaid"           element={<FirstAid />} />
          <Route path="/firstaid/:topicId"   element={<FirstAid />} />
          <Route path="/contacts"           element={<EmergencyContacts />} />
          <Route path="/incidents"          element={<IncidentHistory />} />
          <Route path="/profile"            element={<Profile />} />
        </Routes>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40
                   bg-[#111111] border-t border-neutral-800 flex pb-safe"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]
               transition-colors text-[10px] font-semibold font-heading uppercase tracking-wider
               ${isActive ? 'text-red-500 bg-neutral-950/40' : 'text-neutral-500 hover:text-neutral-350'}`
            }
            aria-label={t(label)}
          >
            <Icon />
            <span className="mt-0.5">{t(label)}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Global Chatbot Widget (persistent across pages) ── */}
      <ChatbotWidget />

      {/* ── PWA Install Prompt ── */}
      <PwaInstallPrompt />
    </div>
  )
}
