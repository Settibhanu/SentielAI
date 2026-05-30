/**
 * SENTINEL SOS — Chat Message Component
 */
import { useNavigate } from 'react-router-dom'

function renderContent(content) {
  // Convert **bold** and newlines to JSX
  const parts = content.split(/(\*\*[^*]+\*\*|\n)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part === '\n') return <br key={i} />
    return part
  })
}

export default function ChatMessage({ message }) {
  const navigate = useNavigate()
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-red-900 flex items-center justify-center
                        text-xs shrink-0 mr-2 mt-0.5" aria-hidden="true">
          🛡
        </div>
      )}
      <div
        className={`
          max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-red-700 text-white rounded-tr-sm'
            : 'bg-[#1A1A1A] border border-neutral-800 text-neutral-200 rounded-tl-sm'}
        `}
      >
        <p>{renderContent(message.content)}</p>

        {/* Action buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.actions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.type === 'navigate' && navigate(action.path)}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
                           text-neutral-300 px-2.5 py-1.5 rounded-lg min-h-[32px]"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-neutral-500 mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
