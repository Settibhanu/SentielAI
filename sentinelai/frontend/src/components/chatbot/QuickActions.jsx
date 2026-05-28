import React from 'react'

const DEFAULT_ACTIONS = [
  { label: '🕳 Report pothole',          message: 'Report pothole' },
  { label: '🗺 Road risk',               message: 'What is the risk here?' },
  { label: '🏛 Who maintains this road?', message: 'Who maintains this road?' },
  { label: '💰 Repair budget',           message: 'What is the repair budget?' },
]

/**
 * QuickActions — horizontal scrollable chip row for common queries.
 * Tapping a chip sends the message immediately.
 */
export default function QuickActions({ actions = DEFAULT_ACTIONS, onSelect, disabled }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 px-3 scrollbar-hide"
      role="list"
      aria-label="Quick action suggestions"
    >
      {actions.map((action, i) => (
        <button
          key={i}
          role="listitem"
          onClick={() => !disabled && onSelect(action.message)}
          disabled={disabled}
          className="flex-shrink-0 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40
                     text-emerald-300 border border-gray-700 px-3 py-2 rounded-full
                     transition-colors min-h-[36px] whitespace-nowrap"
          aria-label={`Quick action: ${action.label}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
