import { create } from 'zustand'
import { getPendingCount } from '../lib/offlineQueue'

const useAppStore = create((set, get) => ({
  // ── Online status ──────────────────────────────────────────────
  isOnline: navigator.onLine,
  pendingOfflineCount: 0,
  setOnline: (v) => set({ isOnline: v }),
  refreshPendingCount: async () => {
    const count = await getPendingCount()
    set({ pendingOfflineCount: count })
  },

  // ── Country / config ───────────────────────────────────────────
  countryCode: 'IN',
  countryConfig: null,
  setCountryCode: (code) => set({ countryCode: code }),
  setCountryConfig: (cfg) => set({ countryConfig: cfg }),

  // ── Selected zone ──────────────────────────────────────────────
  selectedZone: null,
  setSelectedZone: (zone) => set({ selectedZone: zone }),

  // ── Heatmap filters ────────────────────────────────────────────
  filters: {
    city: 'Bengaluru',
    riskLevel: 'all',
    roadType: 'all',
    showAccidents: true,
    showForecast: false,
  },
  setFilter: (key, value) =>
    set(state => ({ filters: { ...state.filters, [key]: value } })),

  // ── Report draft ───────────────────────────────────────────────
  reportDraft: {
    image: null,
    lat: null,
    lng: null,
    damageType: null,
    roadType: 'Urban',
    severity: 'medium',
    description: '',
  },
  setReportField: (key, value) =>
    set(state => ({ reportDraft: { ...state.reportDraft, [key]: value } })),
  resetReportDraft: () =>
    set({
      reportDraft: {
        image: null, lat: null, lng: null,
        damageType: null, roadType: 'Urban', severity: 'medium', description: '',
      },
    }),
}))

export default useAppStore
