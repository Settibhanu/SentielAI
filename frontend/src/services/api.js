/**
 * SENTINEL SOS — API Service Layer
 * All functions handle offline fallback automatically.
 */
import axios from 'axios'
import {
  getCachedServices,
  cacheNearbyServices,
  getOfflineFirstAid,
  cacheFirstAidGuides,
} from '../utils/offline'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Attach user ID header if available
client.interceptors.request.use((config) => {
  const userId = localStorage.getItem('sentinel_user_id')
  if (userId) {
    config.headers['X-User-ID'] = userId
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API]', err.config?.url, err.message)
    return Promise.reject(err)
  }
)

// ── SOS ───────────────────────────────────────────────────────────────────────

export const analyzeEmergency = async (description, lat, lon) => {
  const res = await client.post('/sos/analyze', {
    description,
    latitude: lat,
    longitude: lon,
  })
  return res.data
}

export const getNearbyServices = async (lat, lon, radius = 5000, categories = null) => {
  const params = { lat, lon, radius }
  if (categories) params.categories = categories

  try {
    const res = await client.get('/sos/nearby', { params })
    // Cache for offline use
    cacheNearbyServices(lat, lon, res.data)
    return res.data
  } catch (err) {
    // Offline fallback
    const cached = getCachedServices(lat, lon)
    if (cached) {
      console.log('[API] Using cached nearby services')
      return cached
    }
    throw err
  }
}

export const createSOSEvent = async (incidentType, lat, lon, description = '') => {
  const res = await client.post('/sos/create', {
    incident_type: incidentType,
    latitude: lat,
    longitude: lon,
    description,
  })
  return res.data
}

// ── First Aid ─────────────────────────────────────────────────────────────────

export const getFirstAidGuides = async () => {
  try {
    const res = await client.get('/firstaid')
    cacheFirstAidGuides(res.data)
    return res.data
  } catch (err) {
    const cached = getOfflineFirstAid()
    if (cached) return cached
    throw err
  }
}

export const getFirstAidTopic = async (topicId) => {
  try {
    const res = await client.get(`/firstaid/${topicId}`)
    return res.data
  } catch (err) {
    const cached = getOfflineFirstAid()
    if (cached) {
      const topic = cached.find(t => t.id === topicId)
      if (topic) return topic
    }
    throw err
  }
}

// ── Emergency Contacts ────────────────────────────────────────────────────────

export const getEmergencyContacts = async () => {
  const res = await client.get('/emergency-contacts')
  return res.data
}

export const addEmergencyContact = async (contact) => {
  const res = await client.post('/emergency-contacts', contact)
  return res.data
}

export const updateEmergencyContact = async (id, contact) => {
  const res = await client.put(`/emergency-contacts/${id}`, contact)
  return res.data
}

export const deleteEmergencyContact = async (id) => {
  await client.delete(`/emergency-contacts/${id}`)
}

// ── Incidents ─────────────────────────────────────────────────────────────────

export const getIncidentHistory = async () => {
  const res = await client.get('/incidents')
  return res.data
}

export const resolveIncident = async (id) => {
  const res = await client.patch(`/incidents/${id}/resolve`)
  return res.data
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

export const sendChatMessage = async (message, lat = null, lon = null) => {
  const res = await client.post('/chatbot/message', { message, lat, lon })
  return res.data
}

// ── Config ────────────────────────────────────────────────────────────────────

export const getEmergencyNumbers = async (country = 'DEFAULT') => {
  const res = await client.get(`/config/emergency-numbers?country=${country}`)
  return res.data
}

export default client
