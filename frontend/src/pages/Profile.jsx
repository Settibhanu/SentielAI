/**
 * SENTINEL SOS — Profile & Settings Page
 * Manage user info, emergency number override, offline caches, and app preferences.
 */
import React, { useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { clearAllCaches, getOfflineFirstAid } from '../utils/offline'
import { getFirstAidGuides } from '../services/api'

export default function Profile() {
  const { 
    userId, 
    setUserId, 
    emergencyNumber, 
    setEmergencyNumber,
    mapRadius,
    setMapRadius
  } = useAppStore()

  // User Profile details stored in localStorage
  const [name, setName] = useState(localStorage.getItem('sentinel_user_name') || 'Rescuer User')
  const [email, setEmail] = useState(localStorage.getItem('sentinel_user_email') || 'rescue@sentinel.org')
  const [phone, setPhone] = useState(localStorage.getItem('sentinel_user_phone') || '+1 555-0100')
  const [editing, setEditing] = useState(false)

  // Settings
  const [radius, setRadius] = useState(mapRadius)
  const [notifications, setNotifications] = useState(JSON.parse(localStorage.getItem('sentinel_notifications') !== 'false'))

  // Offline stats
  const [cacheSize, setCacheSize] = useState(0)
  const [offlineStatus, setOfflineStatus] = useState('Checking offline data...')
  const [caching, setCaching] = useState(false)

  const calculateCacheSize = () => {
    let size = 0
    for (let key in localStorage) {
      if (key.startsWith('sentinel_')) {
        size += localStorage[key].length * 2 // roughly 2 bytes per char
      }
    }
    setCacheSize(size)
    
    // Check if first aid guides are cached offline
    const guides = getOfflineFirstAid()
    if (guides && guides.length > 0) {
      setOfflineStatus(`✓ Fully Downloaded (${guides.length} Topics Ready)`)
    } else {
      setOfflineStatus('⚠️ First Aid Offline Guides Not Cached')
    }
  }

  useEffect(() => {
    calculateCacheSize()
  }, [])

  const handleSaveProfile = (e) => {
    e.preventDefault()
    localStorage.setItem('sentinel_user_name', name)
    localStorage.setItem('sentinel_user_email', email)
    localStorage.setItem('sentinel_user_phone', phone)
    setEditing(false)
  }

  const handleRadiusChange = (newVal) => {
    setRadius(newVal)
    setMapRadius(newVal)
  }

  const handleNotificationsToggle = () => {
    const nextVal = !notifications
    setNotifications(nextVal)
    localStorage.setItem('sentinel_notifications', String(nextVal))
  }

  const handleDownloadOffline = async () => {
    setCaching(true)
    setOfflineStatus('Downloading dataset...')
    try {
      // Warm up first aid guides
      const guides = await getFirstAidGuides()
      setOfflineStatus(`✓ Fully Downloaded (${guides.length} Topics Ready)`)
      calculateCacheSize()
      alert('Success! All medically accurate first aid guides have been successfully downloaded and stored locally for offline use.')
    } catch (err) {
      console.error('Failed to cache for offline:', err)
      setOfflineStatus('⚠️ Download failed. Please try again.')
    } finally {
      setCaching(false)
    }
  }

  const handleClearCache = () => {
    if (!window.confirm('This will wipe all cached emergency location data and offline first aid guides. Continue?')) return
    const cleared = clearAllCaches()
    calculateCacheSize()
    alert(`Wiped ${cleared} cached datasets from local storage.`)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <h1 className="font-heading text-2xl text-red-500 tracking-wider">👤 USER PROFILE & SETTINGS</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Control preferences and local offline storage</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* User Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl p-3 bg-neutral-900 border border-neutral-800 rounded-full" aria-hidden="true">
              👤
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-xl text-neutral-200 tracking-wide truncate">{name}</h2>
              <p className="text-xs text-neutral-500 truncate">{email} | {phone}</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-heading text-xs tracking-wider
                           px-3 py-1.5 rounded-lg min-h-[36px] border border-neutral-700 transition-all"
                aria-label="Edit profile details"
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {editing && (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-neutral-850">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 font-heading font-semibold uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 font-heading font-semibold uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 font-heading font-semibold uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-heading text-xs tracking-wider rounded-lg min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-heading text-xs tracking-wider rounded-lg min-h-[38px]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Emergency configuration */}
        <div className="card space-y-4">
          <h3 className="font-heading text-base text-neutral-300 uppercase tracking-wide border-b border-neutral-850 pb-1.5">
            🚨 EMERGENCY CONTACT & TRIGGERS
          </h3>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-neutral-400 font-heading font-semibold uppercase">
                Primary Emergency Hotline
              </label>
              <span className="text-[10px] bg-red-950 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20">
                USER OVERRIDE
              </span>
            </div>
            <input
              type="text"
              value={emergencyNumber}
              onChange={(e) => setEmergencyNumber(e.target.value)}
              placeholder="e.g. 112, 911, 100"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-red-500 font-bold font-heading focus:ring-1 focus:ring-red-600 focus:outline-none"
              aria-label="Set custom emergency number"
            />
            <p className="text-[11px] text-neutral-500 leading-normal">
              Used as the default number for all SOS calls across dashboard triage outputs and assistant chatbot replies. 112 is the default fallback.
            </p>
          </div>
        </div>

        {/* App Settings */}
        <div className="card space-y-4">
          <h3 className="font-heading text-base text-neutral-300 uppercase tracking-wide border-b border-neutral-850 pb-1.5">
            ⚙️ PREFERENCES & GPS SETTINGS
          </h3>

          {/* Map Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-400 font-heading font-semibold uppercase">
              <span>Default Search Radius</span>
              <span className="text-neutral-200">{(radius / 1000).toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-red-600"
              aria-label="Change default search radius"
            />
            <div className="flex justify-between text-[10px] text-neutral-600">
              <span>1.0 km</span>
              <span>10.0 km</span>
              <span>20.0 km</span>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-850/60">
            <div>
              <span className="text-xs text-neutral-300 font-heading font-semibold uppercase block">
                Allow System Notifications
              </span>
              <span className="text-[10px] text-neutral-500">
                Receive visual push notifications during critical SOS updates
              </span>
            </div>
            <button
              onClick={handleNotificationsToggle}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 min-h-[30px] flex items-center
                ${notifications ? 'bg-red-600 justify-end' : 'bg-neutral-800 justify-start'}`}
              aria-label="Toggle system notifications"
            >
              <span className="w-4 h-4 rounded-full bg-white block shadow-md" />
            </button>
          </div>
        </div>

        {/* Offline Management */}
        <div className="card space-y-4">
          <h3 className="font-heading text-base text-neutral-300 uppercase tracking-wide border-b border-neutral-850 pb-1.5">
            💾 OFFLINE RESILIENCE MANAGEMENT
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Offline Database Status:</span>
              <span className="font-semibold text-neutral-200">{offlineStatus}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Local Cache Space:</span>
              <span className="font-semibold text-neutral-200">{(cacheSize / 1024).toFixed(2)} KB</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadOffline}
              disabled={caching}
              className="btn-emergency bg-red-600/10 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs min-h-[44px] disabled:opacity-50"
              aria-label="Download data for offline use"
            >
              {caching ? '💾 Downloading...' : '💾 Download Offline'}
            </button>
            <button
              onClick={handleClearCache}
              className="btn-emergency bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 text-xs min-h-[44px]"
              aria-label="Clear cached datasets"
            >
              🗑️ Clear Cache
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 leading-normal">
            To ensure 100% offline functionality, we suggest downloading the complete medical rescue data dataset. This maps full CPR, severe bleeding tourniquet, fracture splinting, and choking guides.
          </p>
        </div>
      </div>
    </div>
  )
}
