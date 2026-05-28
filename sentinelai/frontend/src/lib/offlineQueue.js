/**
 * Offline report queue using IndexedDB (via idb).
 * Reports submitted while offline are stored here and synced on reconnect.
 */
import { openDB } from 'idb'

const DB_NAME = 'sentinelai-offline'
const STORE = 'pending-reports'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'localId', autoIncrement: true })
      }
    },
  })
}

/** Queue a report for later sync */
export async function queueReport(report) {
  const db = await getDB()
  const id = await db.add(STORE, {
    ...report,
    offline_queued_at: new Date().toISOString(),
  })
  return id
}

/** Get all pending reports */
export async function getPendingReports() {
  const db = await getDB()
  return db.getAll(STORE)
}

/** Remove a report after successful sync */
export async function removeReport(localId) {
  const db = await getDB()
  return db.delete(STORE, localId)
}

/** Count pending reports */
export async function getPendingCount() {
  const db = await getDB()
  return db.count(STORE)
}

/**
 * Sync all pending reports to the backend.
 * Called automatically when the browser comes back online.
 */
export async function syncPendingReports(apiClient) {
  const pending = await getPendingReports()
  if (pending.length === 0) return { synced: 0 }

  const reports = pending.map(({ localId, ...r }) => r)
  try {
    const res = await apiClient.post('/reports/sync-offline', { reports })
    // Remove successfully synced reports
    for (const p of pending) {
      await removeReport(p.localId)
    }
    return { synced: res.data.synced }
  } catch (err) {
    console.error('[OfflineQueue] Sync failed:', err)
    throw err
  }
}
