/**
 * SENTINEL SOS — PWA Install Prompt
 */
import { useState, useEffect } from 'react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('sentinel_pwa_dismissed')
    if (dismissed) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('sentinel_pwa_dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Install SENTINEL SOS"
      className="fixed bottom-20 left-4 right-4 z-50 card border border-red-800 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">🛡</span>
        <div className="flex-1">
          <p className="font-heading text-base text-white">Install SENTINEL SOS</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Add to home screen for instant access in emergencies — works offline.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstall}
          className="flex-1 btn-emergency bg-red-600 hover:bg-red-700 text-white text-sm py-2 min-h-[44px]"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-sm text-neutral-400 hover:text-white min-h-[44px]"
          aria-label="Dismiss install prompt"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
