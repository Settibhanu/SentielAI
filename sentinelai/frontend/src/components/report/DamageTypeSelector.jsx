import React from 'react'

const DAMAGE_TYPES = [
  { id: 'pothole',         label: 'Pothole',         icon: '🕳️' },
  { id: 'crack',           label: 'Crack',           icon: '〰️' },
  { id: 'flooding',        label: 'Flooding',        icon: '🌊' },
  { id: 'broken_signal',   label: 'Broken Signal',   icon: '🚦' },
  { id: 'missing_divider', label: 'Missing Divider', icon: '🚧' },
]

/**
 * DamageTypeSelector — icon grid for selecting the type of road damage.
 * Calls onSelect(damageTypeId) when a type is chosen.
 */
export default function DamageTypeSelector({ selected, onSelect }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Damage Type
      </label>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {DAMAGE_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => onSelect?.(type.id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors
              ${selected === type.id
                ? 'border-red-500 bg-red-950 text-red-300'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
              }`}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="text-xs font-medium">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
