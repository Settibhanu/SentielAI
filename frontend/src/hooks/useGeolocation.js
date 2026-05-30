/**
 * SENTINEL SOS — Geolocation Hook
 * Returns: { lat, lon, accuracy, error, loading, refresh }
 * Uses watchPosition for live updates.
 * Falls back to IP geolocation via ipapi.co if GPS unavailable.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
}

export default function useGeolocation() {
  const [state, setState] = useState({
    lat: null,
    lon: null,
    accuracy: null,
    error: null,
    loading: true,
  })
  const watchIdRef = useRef(null)

  const handleSuccess = useCallback((position) => {
    setState({
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    })
  }, [])

  const handleError = useCallback(async (err) => {
    console.warn('[Geolocation] GPS error:', err.message)
    // Fallback to IP geolocation
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.latitude && data.longitude) {
        setState({
          lat: data.latitude,
          lon: data.longitude,
          accuracy: 5000, // IP geolocation is ~5km accurate
          error: null,
          loading: false,
        })
        return
      }
    } catch (ipErr) {
      console.warn('[Geolocation] IP fallback failed:', ipErr)
    }
    setState(prev => ({
      ...prev,
      error: err.message || 'Location unavailable',
      loading: false,
    }))
  }, [])

  const startWatching = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    if (!navigator.geolocation) {
      handleError(new Error('Geolocation not supported'))
      return
    }

    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GPS_OPTIONS
    )
  }, [handleSuccess, handleError])

  useEffect(() => {
    startWatching()
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [startWatching])

  return {
    ...state,
    refresh: startWatching,
  }
}
