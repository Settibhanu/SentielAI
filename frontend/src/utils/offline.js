/**
 * SENTINEL SOS — Offline Utilities
 * Cache-first strategies for emergency data.
 */

const NEARBY_CACHE_KEY = 'sentinel_nearby_services'
const FIRSTAID_CACHE_KEY = 'sentinel_firstaid_guides'
const EMERGENCY_NUMBERS_KEY = 'sentinel_emergency_numbers'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

// ── Nearby Services ───────────────────────────────────────────────────────────

export const cacheNearbyServices = (lat, lon, data) => {
  try {
    const key = `${NEARBY_CACHE_KEY}_${Math.round(lat * 100)}_${Math.round(lon * 100)}`
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      lat,
      lon,
    }))
  } catch (e) {
    console.warn('[Offline] Failed to cache nearby services:', e)
  }
}

export const getCachedServices = (lat, lon) => {
  try {
    const key = `${NEARBY_CACHE_KEY}_${Math.round(lat * 100)}_${Math.round(lon * 100)}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL_MS) return null
    return data
  } catch (e) {
    return null
  }
}

// ── First Aid Guides ──────────────────────────────────────────────────────────

export const cacheFirstAidGuides = (guides) => {
  try {
    localStorage.setItem(FIRSTAID_CACHE_KEY, JSON.stringify({
      data: guides,
      timestamp: Date.now(),
    }))
  } catch (e) {
    console.warn('[Offline] Failed to cache first aid guides:', e)
  }
}

export const getOfflineFirstAid = () => {
  try {
    const raw = localStorage.getItem(FIRSTAID_CACHE_KEY)
    if (!raw) return null
    const { data } = JSON.parse(raw)
    return data
  } catch (e) {
    return null
  }
}

export const saveFirstAidTopicOffline = (topic) => {
  try {
    const key = `sentinel_firstaid_${topic.id}`
    localStorage.setItem(key, JSON.stringify(topic))
  } catch (e) {
    console.warn('[Offline] Failed to save first aid topic:', e)
  }
}

export const isFirstAidTopicSaved = (topicId) => {
  return localStorage.getItem(`sentinel_firstaid_${topicId}`) !== null
}

// ── Emergency Numbers ─────────────────────────────────────────────────────────

export const cacheEmergencyNumbers = (numbers) => {
  try {
    localStorage.setItem(EMERGENCY_NUMBERS_KEY, JSON.stringify(numbers))
  } catch (e) {}
}

export const getCachedEmergencyNumbers = () => {
  try {
    const raw = localStorage.getItem(EMERGENCY_NUMBERS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

// ── Haversine distance (JS) ───────────────────────────────────────────────────

export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371.0
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(Math.max(0, a)))
}

// ── ETA calculation ───────────────────────────────────────────────────────────

export const estimateETA = (distanceKm, avgSpeedKmh = 40) => {
  const minutes = Math.round((distanceKm / avgSpeedKmh) * 60)
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// ── Clear all caches ──────────────────────────────────────────────────────────

export const clearAllCaches = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('sentinel_'))
  keys.forEach(k => localStorage.removeItem(k))
  return keys.length
}
