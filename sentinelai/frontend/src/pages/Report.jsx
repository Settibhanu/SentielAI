import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import CameraCapture from '../components/report/CameraCapture'
import DamageTypeSelector from '../components/report/DamageTypeSelector'
import RoadTypeSelector from '../components/report/RoadTypeSelector'
import useAppStore from '../store/useAppStore'
import apiClient from '../api/client'
import { queueReport, syncPendingReports } from '../lib/offlineQueue'

export default function Report() {
  const { t } = useTranslation()
  const { isOnline, reportDraft, setReportField, resetReportDraft,
          refreshPendingCount, countryCode } = useAppStore()

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle') // idle | loading | ok | error

  // Auto-detect GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setReportField('lat', pos.coords.latitude)
        setReportField('lng', pos.coords.longitude)
        setGpsStatus('ok')
      },
      () => setGpsStatus('error'),
      { timeout: 8000 },
    )
  }, [])

  async function handleSubmit() {
    if (!reportDraft.damageType) {
      setError('Please select a damage type')
      return
    }
    setSubmitting(true)
    setError(null)

    const payload = {
      image: reportDraft.image,
      lat: reportDraft.lat ?? 12.9716,
      lng: reportDraft.lng ?? 77.5946,
      damage_type: reportDraft.damageType,
      manual_severity: reportDraft.severity,
      road_type: reportDraft.roadType,
      country_code: countryCode,
      description: reportDraft.description,
    }

    if (!isOnline) {
      // Queue for later sync
      await queueReport(payload)
      await refreshPendingCount()
      setResult({ offline: true })
      resetReportDraft()
      setSubmitting(false)
      return
    }

    try {
      const res = await apiClient.post('/reports/submit', payload)
      setResult(res.data)
      resetReportDraft()
    } catch (err) {
      // Network error while "online" — queue it
      await queueReport(payload)
      await refreshPendingCount()
      setResult({ offline: true })
      resetReportDraft()
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        {result.offline ? (
          <div
            className="bg-amber-900/50 border border-amber-700 rounded-xl p-5 text-center"
            role="alert"
          >
            <div className="text-2xl mb-2">📶</div>
            <div className="text-amber-200 font-semibold">{t('report_offline_queued')}</div>
          </div>
        ) : (
          <div
            className="bg-emerald-900/50 border border-emerald-700 rounded-xl p-5 space-y-3"
            role="alert"
          >
            <div className="text-emerald-300 font-semibold text-lg">✅ {t('report_success')}</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>AI Severity: <span className="font-bold text-white">{result.ai_severity_score}/10</span></div>
              <div>Damage class: <span className="font-bold text-white">{result.ai_damage_class}</span></div>
              {result.routing && (
                <div className="mt-3 bg-gray-800 rounded-lg p-3 text-xs space-y-1">
                  <div className="text-emerald-400 font-semibold">{t('report_routed_to')}:</div>
                  <div className="text-white font-medium">{result.routing.routed_to}</div>
                  <div className="text-gray-400">{result.routing.division}</div>
                  <div className="text-gray-400">📞 {result.routing.ee_phone}</div>
                  <div className="text-gray-400">
                    Expected resolution: <span className="text-white">{result.routing.expected_resolution}</span>
                    {' '}({result.routing.sla_days} days SLA)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => setResult(null)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl
                     font-medium transition-colors min-h-[44px]"
        >
          Submit another report
        </button>
      </div>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6" aria-label="Report road damage">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('report_title')}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('report_subtitle')}</p>
      </div>

      {/* GPS status */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>📍</span>
        {gpsStatus === 'loading' && <span>Detecting location…</span>}
        {gpsStatus === 'ok' && (
          <span className="text-emerald-400">
            Location: {reportDraft.lat?.toFixed(4)}, {reportDraft.lng?.toFixed(4)}
          </span>
        )}
        {gpsStatus === 'error' && <span className="text-amber-400">Location unavailable — using default</span>}
        {gpsStatus === 'idle' && <span>Location not yet detected</span>}
      </div>

      <CameraCapture
        onCapture={img => setReportField('image', img)}
      />

      <DamageTypeSelector
        selected={reportDraft.damageType}
        onSelect={v => setReportField('damageType', v)}
      />

      <RoadTypeSelector
        selected={reportDraft.roadType}
        onSelect={v => setReportField('roadType', v)}
      />

      {/* Severity */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300" id="severity-label">
          {t('report_severity')}
        </label>
        <div className="flex gap-3" role="radiogroup" aria-labelledby="severity-label">
          {['low', 'medium', 'high'].map(s => (
            <button
              key={s}
              role="radio"
              aria-checked={reportDraft.severity === s}
              onClick={() => setReportField('severity', s)}
              className={`flex-1 min-h-[44px] rounded-lg border text-sm font-medium capitalize transition-colors
                ${reportDraft.severity === s
                  ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
            >
              {t(`severity_${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300" htmlFor="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={reportDraft.description}
          onChange={e => setReportField('description', e.target.value)}
          rows={3}
          placeholder="Any additional details…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm
                     text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 resize-none"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2" role="alert">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-semibold py-3 rounded-xl transition-colors min-h-[44px]"
        aria-label={t('report_submit')}
      >
        {submitting ? t('report_submitting') : t('report_submit')}
      </button>

      {!isOnline && (
        <p className="text-center text-xs text-amber-400" role="status">
          {t('report_offline_queued')}
        </p>
      )}
    </main>
  )
}
