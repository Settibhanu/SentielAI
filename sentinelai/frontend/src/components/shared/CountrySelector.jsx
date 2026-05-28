import React, { useEffect, useState } from 'react'
import useAppStore from '../../store/useAppStore'
import apiClient from '../../api/client'

/**
 * CountrySelector — switches the active country config.
 * Fetches available countries from /api/config/countries.
 * WCAG AA: labelled select with min 44px height.
 */
export default function CountrySelector() {
  const { countryCode, setCountryCode, setCountryConfig } = useAppStore()
  const [countries, setCountries] = useState([
    { code: 'IN', name: 'India' },
    { code: 'KE', name: 'Kenya' },
  ])

  useEffect(() => {
    apiClient.get('/config/countries')
      .then(res => setCountries(res.data))
      .catch(() => {}) // use defaults on error
  }, [])

  async function handleChange(e) {
    const code = e.target.value
    setCountryCode(code)
    try {
      const res = await apiClient.get(`/config/countries/${code}`)
      setCountryConfig(res.data)
    } catch (_) {}
  }

  return (
    <select
      value={countryCode}
      onChange={handleChange}
      className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1
                 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
      aria-label="Select country"
    >
      {countries.map(c => (
        <option key={c.code} value={c.code}>
          {c.code === 'IN' ? '🇮🇳' : c.code === 'KE' ? '🇰🇪' : '🌍'} {c.name}
        </option>
      ))}
    </select>
  )
}
