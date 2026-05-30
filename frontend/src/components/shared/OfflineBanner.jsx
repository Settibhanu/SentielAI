/**
 * SENTINEL SOS — Offline Banner
 */
import { useEffect, useState } from 'react'
import useAppStore from '../../store/useAppStore'

export default function OfflineBanner() {
  const { isOnline, setOnline } = useAppStore()
  const [visible, setVisible] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setVisible(false) }
    const handleOffline = () => { setOnline(false); setVisible(true) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2
                 bg-amber-600 text-white text-sm font-medium py-2 px-4"
    >
      <span aria-hidden="true">📶</span>
      <span>Offline — showing cached data. Emergency: <strong>Call 112</strong></span>
    </div>
  )
}
