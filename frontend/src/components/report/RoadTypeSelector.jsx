import React from 'react'
import { useTranslation } from 'react-i18next'
import useAppStore from '../../store/useAppStore'

const ROAD_TYPES_IN = [
  { id: 'NH',    label: 'National Highway',    short: 'NH' },
  { id: 'SH',    label: 'State Highway',       short: 'SH' },
  { id: 'MDR',   label: 'Major District Road', short: 'MDR' },
  { id: 'Urban', label: 'Urban Road',          short: 'Urban' },
  { id: 'Local', label: 'Local / Village',     short: 'Local' },
]

/**
 * RoadTypeSelector — lets citizen identify the road type.
 * Road type drives EE routing and SLA days.
 */
export default function RoadTypeSelector({ selected, onSelect }) {
  const { t } = useTranslation()
  const { countryConfig } = useAppStore()

  const types = countryConfig?.road_types
    ? countryConfig.road_types.map(id => ({
        id,
        label: countryConfig.road_type_labels?.[id] ?? id,
        short: id,
      }))
    : ROAD_TYPES_IN

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300" id="road-type-label">
        {t('report_road_type')}
      </label>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-labelledby="road-type-label"
      >
        {types.map(type => (
          <button
            key={type.id}
            role="radio"
            aria-checked={selected === type.id}
            onClick={() => onSelect?.(type.id)}
            className={`min-h-[44px] px-3 py-2 rounded-lg border text-sm font-medium transition-colors
              ${selected === type.id
                ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
              }`}
          >
            <span className="font-bold">{type.short}</span>
            <span className="text-xs ml-1 opacity-70 hidden sm:inline">— {type.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
