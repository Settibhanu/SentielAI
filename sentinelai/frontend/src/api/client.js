import axios from 'axios'

/**
 * Axios instance pre-configured for the SentinelAI backend.
 * Base URL is read from the Vite env variable VITE_API_URL,
 * falling back to localhost for local development.
 */
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor — surface error messages consistently
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'Unknown error'
    console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${message}`)
    return Promise.reject(error)
  },
)

export default apiClient
