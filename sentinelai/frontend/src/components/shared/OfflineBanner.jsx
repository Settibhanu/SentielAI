import React from 'react'
import { useTranslation } from 'react-i18next'
import useAppStore from '../../store/useAppStore'

/**
 * OfflineBanner — shown at the top when the device is offline.
 * Displays pending report count from IndexedDB queue.
 * WCAG AA: role="status", aria-live="polite"
 */
export default function OfflineBanner() {
  const { isOnline, pendingOfflineCount } = useAppStore()
  const { t } = useTranslation()

  if (isOnline && pendingOfflineCount === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`text-center text-sm font-medium py-2 px-4
        ${isOnline
          ? 'bg-emerald-900 text-emerald-200'
          : 'bg-amber-900 text-amber-200'
        }`}
    >
      {isOnline
        ? t('offline_synced', { count: pendingOfflineCount })
        : t('offline_banner', { count: pendingOfflineCount })
      }
    </div>
  )
}
