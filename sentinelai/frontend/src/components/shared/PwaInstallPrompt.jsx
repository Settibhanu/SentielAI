import React, { useEffect, useState } from 'react'

/**
 * PwaInstallPrompt — shows a native-style install banner when the browser
 * fires the `beforeinstallprompt` event (Android Chrome / Edge).
 * Dismissed state is persisted in localStorage.
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setVisible(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!visible) return null

  return (
    <div
      className="pwa-prompt"
      role="dialog"
      aria-label="Install SentinelAI app"
      aria-modal="false"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🛡</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Install SentinelAI</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Add to home screen for offline access and faster reporting
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs
                         font-semibold py-2 rounded-lg min-h-[36px] transition-colors"
              aria-label="Install app"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs
                         py-2 rounded-lg min-h-[36px] transition-colors"
              aria-label="Dismiss install prompt"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
