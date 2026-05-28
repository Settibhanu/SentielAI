import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PriorityQueue from '../components/dashboard/PriorityQueue'
import RepairTracker from '../components/dashboard/RepairTracker'
import BudgetTransparencyTable from '../components/dashboard/BudgetTransparencyTable'
import ComplaintInbox from '../components/dashboard/ComplaintInbox'
import apiClient from '../api/client'

const TABS = ['priority', 'complaints', 'transparency', 'tracker']
const TAB_LABELS = {
  priority:     'Priority Queue',
  complaints:   'Complaint Inbox',
  transparency: 'Budget Transparency',
  tracker:      'Repair Tracker',
}

export default function Authority() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('priority')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await apiClient.get('/dashboard/priority-queue')
      const rows = res.data
      const header = 'Zone,Road Type,API Score,Risk,Reports,Accidents,Last Relay,Est Cost,Status'
      const csv = [header, ...rows.map(r =>
        [r.zone_name, r.road_type, r.api_score, r.risk_category,
         r.damage_reports_count, r.accident_count_1yr, r.last_relaying_date ?? '',
         r.repair_cost_estimate_inr ?? '', r.repair_status ?? ''].join(',')
      )].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sentinelai-priority-queue.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="p-6 space-y-6" aria-label="Authority dashboard">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">{t('authority_title')}</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm
                     px-4 py-2 rounded-lg min-h-[44px] transition-colors"
          aria-label={t('authority_export')}
        >
          {exporting ? 'Exporting…' : `⬇ ${t('authority_export')}`}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 w-fit" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]
              ${activeTab === tab
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'priority'     && <PriorityQueue />}
        {activeTab === 'complaints'   && <ComplaintInbox />}
        {activeTab === 'transparency' && <BudgetTransparencyTable />}
        {activeTab === 'tracker'      && <RepairTracker />}
      </div>
    </main>
  )
}
