/**
 * timeline.js — Temporal progression tracking
 * Stores scan history in IndexedDB. Compares scans over time.
 * Supports both 24hr FLASH and 7-day WATCH timelines.
 */

const DB_NAME = 'cancerome-timeline';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('cancerType', 'cancerType', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveScan(scanResult) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record = {
      timestamp: Date.now(),
      cancerType: scanResult.type?.id || 'unknown',
      hex: scanResult.hex,
      confidence: scanResult.confidence,
      features: scanResult.features,
      severity: scanResult.severity,
      bodyRegion: scanResult.bodyRegion,
      tier: scanResult.tier || 'FLASH'
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getScanHistory(cancerTypeId, limit) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('cancerType');
    const request = cancerTypeId
      ? index.getAll(cancerTypeId)
      : store.getAll();
    request.onsuccess = () => {
      let results = request.result.sort((a, b) => b.timestamp - a.timestamp);
      if (limit) results = results.slice(0, limit);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllScans() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getProgressionSummary(scanHistory) {
  if (!scanHistory || scanHistory.length < 2) {
    return { adequate: false, reason: 'Need at least 2 scans for progression analysis' };
  }

  const sorted = [...scanHistory].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const timeDeltaMs = last.timestamp - first.timestamp;
  const timeDeltaHours = timeDeltaMs / (1000 * 60 * 60);
  const timeDeltaDays = timeDeltaHours / 24;

  const sizeFirst = first.features?.size || 0;
  const sizeLast = last.features?.size || 0;
  const sizeChange = sizeLast - sizeFirst;
  const sizeChangePercent = sizeFirst > 0 ? (sizeChange / sizeFirst) * 100 : 0;

  const intensityFirst = first.features?.intensity || 0;
  const intensityLast = last.features?.intensity || 0;
  const fadeRate = timeDeltaHours > 0 ? (intensityFirst - intensityLast) / timeDeltaHours : 0;

  const tier = timeDeltaDays <= 1.5 ? 'FLASH' : 'WATCH';

  return {
    adequate: true,
    scanCount: sorted.length,
    timeDeltaHours: Math.round(timeDeltaHours * 10) / 10,
    timeDeltaDays: Math.round(timeDeltaDays * 10) / 10,
    tier,
    sizeChange: Math.round(sizeChange * 10) / 10,
    sizeChangePercent: Math.round(sizeChangePercent),
    fadeRate: Math.round(fadeRate * 1000) / 1000,
    trending: sizeChange > 0.5 ? 'GROWING' : sizeChange < -0.5 ? 'SHRINKING' : 'STABLE'
  };
}

export async function clearHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
