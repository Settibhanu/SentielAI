/**
 * SENTINEL SOS — Quick Action Chips
 */
const DEFAULT_ACTIONS = [
  { label: '🚗 Accident', message: "I've been in an accident" },
  { label: '🔧 Flat Tire', message: 'I have a flat tire' },
  { label: '🚑 Need Ambulance', message: 'Someone is injured and needs an ambulance' },
  { label: '❤️ Medical Emergency', message: 'Medical emergency, person is unconscious' },
]

export default function QuickActions({ onSelect, actions = DEFAULT_ACTIONS }) {
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
          onClick={() => onSelect(action.message)}
          className="shrink-0 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
                     text-neutral-300 px-3 py-2 rounded-full min-h-[36px] whitespace-nowrap
                     transition-colors"
          aria-label={action.label}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
