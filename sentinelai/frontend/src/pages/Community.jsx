import React from 'react'
import { useTranslation } from 'react-i18next'

const TOP_CONTRIBUTORS = [
  { rank: 1, name: 'Priya S.',    city: 'Bengaluru', reports: 142, verified: 138, badges: ['🏆','⭐','🔥'], trust: 4.9 },
  { rank: 2, name: 'Rajan M.',    city: 'Chennai',   reports: 98,  verified: 91,  badges: ['⭐','🔥'],      trust: 4.7 },
  { rank: 3, name: 'Ananya K.',   city: 'Bengaluru', reports: 87,  verified: 85,  badges: ['⭐'],            trust: 4.8 },
  { rank: 4, name: 'Vikram P.',   city: 'Mumbai',    reports: 74,  verified: 68,  badges: ['🔥'],            trust: 4.5 },
  { rank: 5, name: 'Deepa R.',    city: 'Hyderabad', reports: 61,  verified: 58,  badges: ['⭐'],            trust: 4.6 },
]

const CITY_LEADERBOARD = [
  { city: 'Bengaluru', reports: 1842, zones_improved: 23, risk_reduced: '18%' },
  { city: 'Chennai',   reports: 1204, zones_improved: 15, risk_reduced: '12%' },
  { city: 'Mumbai',    reports: 987,  zones_improved: 11, risk_reduced: '9%'  },
  { city: 'Delhi',     reports: 876,  zones_improved: 9,  risk_reduced: '7%'  },
  { city: 'Hyderabad', reports: 654,  zones_improved: 7,  risk_reduced: '6%'  },
]

const IMPACT = [
  { label: 'Reports submitted',    value: '5,563',  icon: '📋' },
  { label: 'Zones improved',       value: '65',     icon: '🗺' },
  { label: 'Repairs triggered',    value: '38',     icon: '🔧' },
  { label: 'Estimated lives saved',value: '12+',    icon: '❤️' },
]

export default function Community() {
  const { t } = useTranslation()

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8" aria-label="Community page">
      <h1 className="text-2xl font-bold text-white">{t('community_title')}</h1>

      {/* Impact counter */}
      <section aria-labelledby="impact-heading">
        <h2 id="impact-heading" className="text-base font-semibold text-white mb-3">
          {t('community_impact')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMPACT.map(item => (
            <div key={item.label} className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top contributors */}
      <section aria-labelledby="contributors-heading">
        <h2 id="contributors-heading" className="text-base font-semibold text-white mb-3">
          {t('community_top_contributors')}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm" aria-label="Top contributors">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Contributor</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Reports</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Trust</th>
                <th className="px-4 py-3">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {TOP_CONTRIBUTORS.map(c => (
                <tr key={c.rank} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono">{c.rank}</td>
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400">{c.city}</td>
                  <td className="px-4 py-3 text-gray-300">{c.reports}</td>
                  <td className="px-4 py-3 text-emerald-400">{c.verified}</td>
                  <td className="px-4 py-3 text-yellow-400">{c.trust}/5</td>
                  <td className="px-4 py-3">{c.badges.join(' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* City leaderboard */}
      <section aria-labelledby="leaderboard-heading">
        <h2 id="leaderboard-heading" className="text-base font-semibold text-white mb-3">
          {t('community_leaderboard')}
        </h2>
        <div className="space-y-2">
          {CITY_LEADERBOARD.map((city, i) => (
            <div
              key={city.city}
              className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-4"
            >
              <span className="text-gray-500 font-mono text-sm w-5">{i + 1}</span>
              <span className="text-white font-medium flex-1">{city.city}</span>
              <span className="text-gray-400 text-xs">{city.reports} reports</span>
              <span className="text-emerald-400 text-xs">{city.zones_improved} zones improved</span>
              <span className="text-blue-400 text-xs">Risk ↓{city.risk_reduced}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
