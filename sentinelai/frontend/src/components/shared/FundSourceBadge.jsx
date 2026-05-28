import React from 'react'

const SOURCE_COLORS = {
  'PMGSY':              'bg-blue-900 text-blue-300 border-blue-700',
  'NHAI':               'bg-purple-900 text-purple-300 border-purple-700',
  'State PWD':          'bg-indigo-900 text-indigo-300 border-indigo-700',
  'Municipal Corp':     'bg-teal-900 text-teal-300 border-teal-700',
  'Municipal Corporation': 'bg-teal-900 text-teal-300 border-teal-700',
  'CRIF':               'bg-cyan-900 text-cyan-300 border-cyan-700',
  'MLA LAD Fund':       'bg-amber-900 text-amber-300 border-amber-700',
  'MP LAD Fund':        'bg-orange-900 text-orange-300 border-orange-700',
  'World Bank':         'bg-sky-900 text-sky-300 border-sky-700',
  'AfDB':               'bg-emerald-900 text-emerald-300 border-emerald-700',
}

/**
 * FundSourceBadge — colored pill showing the fund source for a repair.
 * Optionally links to the fund_source_url.
 */
export default function FundSourceBadge({ source, url }) {
  const style = SOURCE_COLORS[source] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  const cls = `inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${style}`

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cls} hover:opacity-80 underline`}
        aria-label={`Fund source: ${source}`}
      >
        {source}
      </a>
    )
  }
  return (
    <span className={cls} aria-label={`Fund source: ${source}`}>
      {source}
    </span>
  )
}
