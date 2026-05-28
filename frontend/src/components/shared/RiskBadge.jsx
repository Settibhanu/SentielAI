import React from 'react'
import { useTranslation } from 'react-i18next'

const STYLES = {
  Low:      'bg-green-900 text-green-300 border border-green-700',
  Medium:   'bg-yellow-900 text-yellow-300 border border-yellow-700',
  High:     'bg-orange-900 text-orange-300 border border-orange-700',
  Critical: 'bg-red-900 text-red-300 border border-red-700',
}

const I18N_KEYS = {
  Low: 'risk_low', Medium: 'risk_medium', High: 'risk_high', Critical: 'risk_critical',
}

export default function RiskBadge({ category }) {
  const { t } = useTranslation()
  const style = STYLES[category] ?? 'bg-gray-800 text-gray-400 border border-gray-700'
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}
      aria-label={`Risk level: ${category}`}
    >
      {t(I18N_KEYS[category] ?? 'risk_low', category)}
    </span>
  )
}
