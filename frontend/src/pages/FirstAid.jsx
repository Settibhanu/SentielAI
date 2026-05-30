/**
 * SENTINEL SOS — First Aid Guide Page
 * Displays medically accurate step-by-step guides with offline saving capability.
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFirstAidGuides } from '../services/api'
import { saveFirstAidTopicOffline, isFirstAidTopicSaved, getOfflineFirstAid, cacheFirstAidGuides } from '../utils/offline'

export default function FirstAid() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [savedStatus, setSavedStatus] = useState({})

  // Load guides on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await getFirstAidGuides()
        setGuides(data)
        // Check offline saved status for each topic
        const statusMap = {}
        data.forEach(topic => {
          statusMap[topic.id] = isFirstAidTopicSaved(topic.id)
        })
        setSavedStatus(statusMap)
      } catch (err) {
        console.error('Failed to load first aid guides:', err)
        // Attempt offline fallback
        const offlineGuides = getOfflineFirstAid()
        if (offlineGuides) {
          setGuides(offlineGuides)
          const statusMap = {}
          offlineGuides.forEach(topic => {
            statusMap[topic.id] = isFirstAidTopicSaved(topic.id)
          })
          setSavedStatus(statusMap)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // If a topicId parameter exists, set selectedTopic
  useEffect(() => {
    if (topicId && guides.length > 0) {
      const topic = guides.find(g => g.id === topicId)
      if (topic) {
        setSelectedTopic(topic)
      }
    } else {
      setSelectedTopic(null)
    }
  }, [topicId, guides])

  const handleSaveOffline = (e, topic) => {
    e.stopPropagation()
    saveFirstAidTopicOffline(topic)
    setSavedStatus(prev => ({ ...prev, [topic.id]: true }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-heading text-lg tracking-wider text-neutral-400">LOADING FIRST AID GUIDES...</span>
      </div>
    )
  }

  // Topic detail view
  if (selectedTopic) {
    const isSaved = savedStatus[selectedTopic.id]
    const severityColors = {
      CRITICAL: 'bg-red-900/30 border-red-700 text-red-400',
      HIGH: 'bg-orange-900/30 border-orange-700 text-orange-400',
      MEDIUM: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
      LOW: 'bg-green-900/30 border-green-700 text-green-400',
    }

    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/firstaid')}
            className="text-neutral-400 hover:text-white p-2 min-h-[44px] flex items-center"
            aria-label="Go back to list"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-xl text-neutral-200 tracking-wider flex items-center gap-2">
              <span>{selectedTopic.icon}</span> {selectedTopic.title}
            </h1>
          </div>
          <button
            onClick={(e) => handleSaveOffline(e, selectedTopic)}
            disabled={isSaved}
            className={`px-3 py-1.5 rounded-lg font-heading text-xs font-semibold tracking-wider min-h-[38px] flex items-center gap-1.5 transition-all
              ${isSaved 
                ? 'bg-emerald-950/30 border border-emerald-500 text-emerald-400' 
                : 'bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 active:scale-95'}`}
          >
            {isSaved ? '✓ Saved Offline' : '💾 Save Offline'}
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
          {/* Summary / Severity Indicator */}
          <div className={`p-4 rounded-xl border ${severityColors[selectedTopic.severity_indicator] || 'border-neutral-800 bg-neutral-900/30'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold font-heading uppercase tracking-widest px-2 py-0.5 rounded bg-neutral-950">
                {selectedTopic.severity_indicator} Priority
              </span>
              {isSaved && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded">
                  ✓ Offline Cache
                </span>
              )}
            </div>
            <p className="text-neutral-200 text-sm leading-relaxed">{selectedTopic.summary}</p>
          </div>

          {/* Warnings */}
          {selectedTopic.warnings && selectedTopic.warnings.length > 0 && (
            <div className="bg-red-950/20 border border-red-700/60 rounded-xl p-4 space-y-2">
              <h2 className="font-heading text-sm text-red-500 tracking-wider flex items-center gap-1.5">
                ⚠️ CRITICAL WARNINGS
              </h2>
              <ul className="space-y-1.5 text-neutral-300 text-xs leading-relaxed">
                {selectedTopic.warnings.map((warning, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-red-600 shrink-0 font-bold">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            <h2 className="font-heading text-base text-neutral-300 tracking-wider uppercase border-b border-neutral-800 pb-1.5">
              Action Steps
            </h2>
            <ol className="space-y-3">
              {selectedTopic.steps.map((step, idx) => {
                // Highlight critical lines
                const isCriticalStep = step.toLowerCase().includes('immediately') || step.toLowerCase().includes('112') || step.toLowerCase().includes('911') || step.toLowerCase().includes('cpr')
                return (
                  <li 
                    key={idx} 
                    className={`p-3.5 rounded-xl border transition-all text-sm leading-relaxed
                      ${isCriticalStep 
                        ? 'bg-red-950/10 border-red-800/40 text-neutral-100 shadow-md ring-1 ring-red-900/10' 
                        : 'bg-neutral-900/50 border-neutral-800/60 text-neutral-300'}`}
                  >
                    {step}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* When to Call Emergency */}
          {selectedTopic.when_to_call_emergency && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1.5">
              <h3 className="font-heading text-xs text-neutral-400 tracking-wider uppercase">When to call emergency services</h3>
              <p className="text-xs text-neutral-300 font-semibold">{selectedTopic.when_to_call_emergency}</p>
            </div>
          )}

          {/* Video search advice */}
          {selectedTopic.video_search_term && (
            <div className="flex items-center justify-between p-3.5 bg-neutral-900/50 border border-neutral-800 rounded-xl">
              <span className="text-xs text-neutral-400">Need visual demonstration? Search YouTube for:</span>
              <a 
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTopic.video_search_term)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1 shrink-0 ml-4 min-h-[44px]"
              >
                📺 {selectedTopic.video_search_term}
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl text-red-500 tracking-wider">📋 FIRST AID GUIDE</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Medically accurate step-by-step procedures</p>
          </div>
          <span className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 px-2.5 py-1 rounded-full font-heading">
            {guides.length} TOPICS AVAILABLE
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Grid of topic cards */}
        <div className="grid grid-cols-1 gap-3" role="list">
          {guides.map((topic) => {
            const isSaved = savedStatus[topic.id]
            const indicatorColors = {
              CRITICAL: 'text-red-500 border-red-500/20 bg-red-500/10',
              HIGH: 'text-orange-500 border-orange-500/20 bg-orange-500/10',
              MEDIUM: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10',
              LOW: 'text-green-500 border-green-500/20 bg-green-500/10',
            }

            return (
              <div
                key={topic.id}
                role="listitem"
                onClick={() => navigate(`/firstaid/${topic.id}`)}
                className="card flex items-start gap-4 hover:bg-neutral-850 active:scale-[0.99] transition-all cursor-pointer group"
              >
                {/* Topic Icon */}
                <span className="text-4xl shrink-0 p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl group-hover:scale-105 transition-transform" aria-hidden="true">
                  {topic.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="font-heading text-lg text-neutral-200 tracking-wide group-hover:text-white transition-colors truncate">
                      {topic.title}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSaved && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                          Offline
                        </span>
                      )}
                      <span className={`text-[10px] font-bold font-heading px-2 py-0.5 rounded border ${indicatorColors[topic.severity_indicator] || 'text-neutral-400 border-neutral-800'}`}>
                        {topic.severity_indicator}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {topic.summary}
                  </p>
                  
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500 group-hover:text-red-400 transition-colors">
                      View full guide →
                    </span>
                    {!isSaved && (
                      <button
                        onClick={(e) => handleSaveOffline(e, topic)}
                        className="text-[10px] bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white px-2 py-1 rounded min-h-[30px] flex items-center transition-all active:scale-95"
                      >
                        💾 Save Offline
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
