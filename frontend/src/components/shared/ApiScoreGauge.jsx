import React from 'react'

function scoreColor(s) {
  if (s >= 75) return '#ef4444'
  if (s >= 50) return '#f97316'
  if (s >= 25) return '#eab308'
  return '#22c55e'
}

/**
 * ApiScoreGauge — circular SVG gauge for API Score (0–100).
 * WCAG: aria-label with score value.
 */
export default function ApiScoreGauge({ score = 0, label = 'API Score', size = 140 }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score))
  const offset = circumference - (progress / 100) * circumference
  const color = scoreColor(progress)

  return (
    <div
      className="flex flex-col items-center gap-1"
      aria-label={`${label}: ${progress} out of 100`}
      role="img"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="#374151" strokeWidth={10} />
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{progress}</span>
          <span className="text-gray-500 text-xs">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
