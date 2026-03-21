/**
 * dashboard.js — Doctor dashboard logic
 * Handles import, decryption, display, and triage of patient scan reports.
 */

const patients = [];

document.addEventListener('DOMContentLoaded', () => {
  wireImport();
  wireNavigation();
});

function wireImport() {
  const importZone = document.getElementById('import-zone');
  const fileInput = document.getElementById('file-input');

  importZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    importZone.classList.add('dragover');
  });

  importZone.addEventListener('dragleave', () => {
    importZone.classList.remove('dragover');
  });

  importZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    importZone.classList.remove('dragover');
    for (const file of e.dataTransfer.files) {
      await importFile(file);
    }
  });

  fileInput.addEventListener('change', async () => {
    for (const file of fileInput.files) {
      await importFile(file);
    }
    fileInput.value = '';
  });
}

async function importFile(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    alert(`Invalid JSON: ${file.name}`);
    return;
  }

  if (data.algorithm && data.ciphertext) {
    // Encrypted report — prompt for passphrase
    const passphrase = prompt(`Enter passphrase for ${file.name}:`);
    if (!passphrase) return;

    try {
      const decrypted = await decryptReport(data, passphrase);
      addPatient(decrypted, file.name);
    } catch {
      alert('Decryption failed — wrong passphrase or corrupted file.');
    }
  } else if (data.resourceType === 'Bundle') {
    // FHIR bundle
    const conclusion = data.entry?.[0]?.resource?.conclusion || 'No conclusion';
    addPatient({ detection: { cancerType: 'FHIR Import' }, fhirConclusion: conclusion, raw: data }, file.name);
  } else if (data.version && data.detection) {
    // Unencrypted report
    addPatient(data, file.name);
  } else {
    alert(`Unrecognized format: ${file.name}`);
  }
}

async function decryptReport(encryptedPackage, passphrase) {
  const encoder = new TextEncoder();
  const salt = base64ToArray(encryptedPackage.salt);
  const iv = base64ToArray(encryptedPackage.iv);
  const ciphertext = base64ToArray(encryptedPackage.ciphertext);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function base64ToArray(b64) {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

function addPatient(report, filename) {
  patients.push({ report, filename, importedAt: new Date() });
  // Sort by severity (CRITICAL first)
  const order = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
  patients.sort((a, b) => {
    const aLevel = a.report.severity?.level || 'LOW';
    const bLevel = b.report.severity?.level || 'LOW';
    return (order[aLevel] ?? 4) - (order[bLevel] ?? 4);
  });
  renderQueue();
}

function renderQueue() {
  const queue = document.getElementById('patient-queue');
  if (patients.length === 0) {
    queue.innerHTML = '<li class="empty-state">No patient reports loaded.</li>';
    return;
  }

  queue.innerHTML = patients.map((p, i) => {
    const report = p.report;
    const detection = report.detection || {};
    const severity = report.severity || {};
    const severityColor =
      severity.level === 'CRITICAL' ? '#9C27B0' :
      severity.level === 'HIGH' ? '#F44336' :
      severity.level === 'MODERATE' ? '#FF9800' : '#4CAF50';

    return `
      <li class="patient-card" data-index="${i}" style="border-left-color: ${detection.hex || severityColor}">
        <div class="type-name">${detection.cancerType || detection.cancerTypeId || 'Unknown'}</div>
        <span class="severity" style="background: ${severityColor}; color: ${severity.level === 'LOW' || severity.level === 'MODERATE' ? '#000' : '#fff'}">
          ${severity.level || 'UNKNOWN'}
        </span>
        <span class="time">${p.importedAt.toLocaleTimeString()} — ${p.filename}</span>
        <div style="margin-top: 0.3rem; font-size: 0.85rem; color: #ccc;">${severity.action || ''}</div>
      </li>
    `;
  }).join('');

  queue.querySelectorAll('.patient-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      showDetail(patients[idx]);
    });
  });
}

function showDetail(patient) {
  const report = patient.report;
  const content = document.getElementById('detail-content');

  content.innerHTML = `
    <div class="result-card" style="border-left-color: ${report.detection?.hex || '#888'}">
      <h3>Detection</h3>
      <div class="result-value">${report.detection?.cancerType || 'Unknown'}</div>
      <div class="result-hex">${report.detection?.hex || '--'} (${report.detection?.confidence || '?'})</div>
    </div>
    <div class="result-card" style="border-left-color: ${report.severity?.color || '#888'}">
      <h3>Severity</h3>
      <div class="severity-badge ${report.severity?.level || ''}">${report.severity?.level || 'UNKNOWN'}</div>
      <div class="result-action">${report.severity?.action || ''}</div>
    </div>
    <div class="result-card">
      <h3>Features</h3>
      <table id="features-table">
        <tr><td>Size</td><td>${report.features?.size ?? '--'} cm</td></tr>
        <tr><td>Intensity</td><td>${report.features?.intensity ? Math.round(report.features.intensity * 100) + '%' : '--'}</td></tr>
        <tr><td>Edge</td><td>${report.features?.edgeGradient ?? '--'}</td></tr>
        <tr><td>Satellites</td><td>${report.features?.satelliteCount ?? '--'}</td></tr>
      </table>
    </div>
    <div class="result-card">
      <h3>Specialist Routing</h3>
      <div class="result-value">${report.specialist?.specialist?.title || report.specialist?.action || 'General Oncologist'}</div>
      <div class="result-detail">${report.specialist?.specialist?.urgencyNote || ''}</div>
    </div>
    <div class="result-card">
      <h3>Scan History</h3>
      ${report.scanHistory?.length > 0
        ? report.scanHistory.map((s) => `<div style="font-size: 0.85rem; padding: 0.2rem 0;">${s.timestamp} — ${s.cancerType} — ${s.severity || '?'} — ${s.size ?? '?'}cm</div>`).join('')
        : '<div class="empty-state">No history</div>'
      }
    </div>
    <div class="result-card">
      <h3>File</h3>
      <div class="result-detail">${patient.filename} — imported ${patient.importedAt.toLocaleString()}</div>
    </div>
  `;

  document.getElementById('queue-view').style.display = 'none';
  document.getElementById('detail-view').classList.add('active');
}

function wireNavigation() {
  document.getElementById('btn-back-queue').addEventListener('click', () => {
    document.getElementById('detail-view').classList.remove('active');
    document.getElementById('queue-view').style.display = 'block';
  });
}
