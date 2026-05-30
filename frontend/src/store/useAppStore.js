/**
 * SENTINEL SOS — Global App Store (Zustand)
 */
import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // ── Online status ──────────────────────────────────────────────────────────
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),

  // ── Geolocation ────────────────────────────────────────────────────────────
  location: { lat: null, lon: null, accuracy: null },
  locationError: null,
  locationLoading: false,
  setLocation: (loc) => set({ location: loc, locationError: null }),
  setLocationError: (err) => set({ locationError: err, locationLoading: false }),
  setLocationLoading: (v) => set({ locationLoading: v }),

  // ── Active SOS event ───────────────────────────────────────────────────────
  activeSOSEvent: null,
  setActiveSOSEvent: (event) => set({ activeSOSEvent: event }),
  clearSOSEvent: () => set({ activeSOSEvent: null }),

  // ── Triage result ──────────────────────────────────────────────────────────
  triageResult: null,
  setTriageResult: (result) => set({ triageResult: result }),

  // ── Nearby services ────────────────────────────────────────────────────────
  nearbyServices: {},
  setNearbyServices: (services) => set({ nearbyServices: services }),

  // ── Map settings ───────────────────────────────────────────────────────────
  mapRadius: 5000,
  setMapRadius: (r) => set({ mapRadius: r }),
  activeCategories: [
    'hospital', 'ambulance', 'police', 'fire_station',
    'mechanic', 'fuel_station', 'puncture_shop', 'towing'
  ],
  toggleCategory: (cat) => set((state) => ({
    activeCategories: state.activeCategories.includes(cat)
      ? state.activeCategories.filter(c => c !== cat)
      : [...state.activeCategories, cat]
  })),

  // ── User settings ──────────────────────────────────────────────────────────
  userId: localStorage.getItem('sentinel_user_id') || null,
  emergencyNumber: localStorage.getItem('sentinel_emergency_number') || '112',
  setUserId: (id) => {
    localStorage.setItem('sentinel_user_id', id)
    set({ userId: id })
  },
  setEmergencyNumber: (num) => {
    localStorage.setItem('sentinel_emergency_number', num)
    set({ emergencyNumber: num })
  },
}))

export default useAppStore
