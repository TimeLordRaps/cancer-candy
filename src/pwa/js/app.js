/**
 * app.js — Main orchestrator
 * Wires together the full scanner pipeline: calibrate → scan → position → analyze → results.
 */

import { initCamera, captureFrame, getCenterRGB, stopCamera } from './camera.js';
import { loadCancerTypes, matchCancerType, rgbToHex } from './hex-lookup.js';
import { loadCalibrationData, detectSkinType, applyCorrectionToRGB, resetCalibration } from './skin-calibration.js';
import { loadBodyRegions, getRegionById, crossValidateRegionAndType } from './body-mapper.js';
import { analyzeSplotch } from './splotch-analyzer.js';
import { loadSeverityRules, calculateSeverity } from './severity-scorer.js';
import { loadSpecialists, routeToSpecialist } from './doctor-router.js';
import { saveScan, getScanHistory, getAllScans, getProgressionSummary } from './timeline.js';
import { renderCancerome } from './cancerome-3d.js';
import { generateReport, generateFHIRBundle, encryptReport, downloadAsFile } from './export.js';

// State
const state = {
  skinCalibrated: false,
  capturedSplotchRGB: null,
  correctedRGB: null,
  matchResult: null,
  selectedRegion: null,
  features: null,
  severity: null,
  routing: null,
  scanCtx: null
};

// Boot
document.addEventListener('DOMContentLoaded', async () => {
  // Load all data files in parallel
  await Promise.all([
    loadCancerTypes(),
    loadCalibrationData(),
    loadBodyRegions(),
    loadSeverityRules(),
    loadSpecialists()
  ]);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }

  // Wire up UI
  wireCalibrationStep();
  wireScanStep();
  wirePositionStep();
  wireResultsStep();

  // Start camera for calibration
  initCamera('calibration-preview');
});

// Step navigation
function showStep(stepId) {
  document.querySelectorAll('.step').forEach((s) => s.classList.remove('active'));
  const step = document.getElementById(stepId);
  if (step) step.classList.add('active');
}

// Step 1: Calibration
function wireCalibrationStep() {
  document.getElementById('btn-calibrate').addEventListener('click', () => {
    const { ctx } = captureFrame();
    const centerRGB = getCenterRGB(ctx);
    const skinType = detectSkinType(centerRGB);

    document.getElementById('detected-skin-type').textContent = `Type ${skinType.type}`;
    document.getElementById('skin-type-name').textContent = skinType.name;

    state.skinCalibrated = true;
    stopCamera();

    // Move to scan
    initCamera('scan-preview');
    showStep('step-scan');
  });

  document.getElementById('btn-skip-calibrate').addEventListener('click', () => {
    resetCalibration();
    state.skinCalibrated = false;
    stopCamera();
    initCamera('scan-preview');
    showStep('step-scan');
  });
}

// Step 2: Scan
function wireScanStep() {
  // Live hex preview (runs on animation frame)
  let previewActive = false;
  const hexValue = document.getElementById('hex-value');
  const hexSwatch = document.getElementById('hex-swatch');
  const matchDisplay = document.getElementById('cancer-type-match');

  function updatePreview() {
    if (!previewActive) return;
    try {
      const { ctx } = captureFrame('scan-canvas');
      const rawRGB = getCenterRGB(ctx);
      const corrected = applyCorrectionToRGB(rawRGB);
      const hex = rgbToHex(corrected.r, corrected.g, corrected.b);
      hexValue.textContent = hex;
      hexSwatch.style.backgroundColor = hex;

      const match = matchCancerType(corrected);
      if (match.confidence === 'MATCH' || match.confidence === 'PROBABLE') {
        matchDisplay.textContent = `${match.type.name} (${match.confidence})`;
        matchDisplay.style.color = match.type.hex;
      } else {
        matchDisplay.textContent = match.confidence === 'POSSIBLE'
          ? `Possible: ${match.type.name}`
          : 'No match — adjust camera position';
        matchDisplay.style.color = '#888';
      }
    } catch {
      // Camera may not be ready yet
    }
    requestAnimationFrame(updatePreview);
  }

  // Start preview when scan step becomes active
  const observer = new MutationObserver(() => {
    const scanStep = document.getElementById('step-scan');
    if (scanStep.classList.contains('active') && !previewActive) {
      previewActive = true;
      updatePreview();
    } else if (!scanStep.classList.contains('active')) {
      previewActive = false;
    }
  });
  observer.observe(document.getElementById('step-scan'), { attributes: true });

  document.getElementById('btn-capture').addEventListener('click', () => {
    previewActive = false;
    const { ctx } = captureFrame('scan-canvas');
    const rawRGB = getCenterRGB(ctx);
    const corrected = applyCorrectionToRGB(rawRGB);
    const match = matchCancerType(corrected);

    state.capturedSplotchRGB = rawRGB;
    state.correctedRGB = corrected;
    state.matchResult = match;
    state.scanCtx = ctx;

    stopCamera();
    showStep('step-position');
  });

  document.getElementById('btn-back-calibrate').addEventListener('click', () => {
    previewActive = false;
    stopCamera();
    initCamera('calibration-preview');
    showStep('step-calibrate');
  });
}

// Step 3: Body Position
function wirePositionStep() {
  const bodyParts = document.querySelectorAll('.body-part');
  const positionLabel = document.getElementById('position-label');
  const confirmBtn = document.getElementById('btn-confirm-position');

  bodyParts.forEach((part) => {
    part.addEventListener('click', () => {
      bodyParts.forEach((p) => p.classList.remove('selected'));
      part.classList.add('selected');
      const regionId = part.dataset.region;
      const region = getRegionById(regionId);
      state.selectedRegion = regionId;
      positionLabel.textContent = region ? region.name : regionId;
      confirmBtn.disabled = false;
    });
  });

  confirmBtn.addEventListener('click', async () => {
    // Run full analysis pipeline
    const features = analyzeSplotch(state.scanCtx, state.correctedRGB);
    state.features = features;

    const severity = calculateSeverity(features);
    state.severity = severity;

    const routing = routeToSpecialist(
      state.matchResult.type?.id,
      severity.level
    );
    state.routing = routing;

    // Cross-validate region + type
    const validation = crossValidateRegionAndType(
      state.selectedRegion,
      state.matchResult.type?.id
    );

    // Save scan
    await saveScan({
      type: state.matchResult.type,
      hex: state.matchResult.hex,
      confidence: state.matchResult.confidence,
      features,
      severity,
      bodyRegion: state.selectedRegion
    });

    // Populate results
    populateResults(validation);
    showStep('step-results');
  });

  document.getElementById('btn-back-scan').addEventListener('click', () => {
    initCamera('scan-preview');
    showStep('step-scan');
  });
}

function populateResults(validation) {
  const match = state.matchResult;
  const features = state.features;
  const severity = state.severity;
  const routing = state.routing;

  // Type card
  document.getElementById('result-type-name').textContent = match.type?.name || 'Unknown';
  document.getElementById('result-type-hex').textContent = match.hex;
  document.getElementById('result-chromophore').textContent = match.type?.chromophore || '';
  document.getElementById('card-type').style.borderLeftColor = match.type?.hex || '#888';

  // Severity card
  const severityBadge = document.getElementById('result-severity-level');
  severityBadge.textContent = severity.level;
  severityBadge.className = `severity-badge ${severity.level}`;
  document.getElementById('result-severity-score').textContent = `Score: ${severity.totalScore}`;
  document.getElementById('result-severity-action').textContent = severity.action;
  document.getElementById('card-severity').style.borderLeftColor = severity.color;

  // Features card
  document.getElementById('feat-size').textContent = `${features.size} cm`;
  document.getElementById('feat-intensity').textContent = `${Math.round(features.intensity * 100)}%`;
  document.getElementById('feat-edge').textContent = features.edgeGradient > 0.7 ? 'Sharp' : features.edgeGradient > 0.4 ? 'Moderate' : 'Diffuse';
  document.getElementById('feat-satellites').textContent = `${features.satelliteCount}`;
  document.getElementById('feat-fade').textContent = features.fadeRate !== null ? `${features.fadeRate}/hr` : 'N/A (single scan)';

  // Doctor card
  if (routing.emergency) {
    document.getElementById('result-specialist').textContent = 'EMERGENCY';
    document.getElementById('result-specialist').style.color = '#F44336';
    document.getElementById('result-urgency').textContent = routing.action;
  } else if (routing.specialist) {
    document.getElementById('result-specialist').textContent = routing.specialist.title;
    document.getElementById('result-urgency').textContent = routing.specialist.urgencyNote;
  } else {
    document.getElementById('result-specialist').textContent = 'General Oncologist';
    document.getElementById('result-urgency').textContent = routing.action;
  }

  // Region validation warning
  if (validation?.warning) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'result-detail';
    warningDiv.style.color = '#FF9800';
    warningDiv.textContent = validation.reason;
    document.getElementById('card-type').appendChild(warningDiv);
  }
}

// Step 4: Results actions
function wireResultsStep() {
  document.getElementById('btn-export').addEventListener('click', async () => {
    const history = await getScanHistory(state.matchResult.type?.id, 20);
    const report = await generateReport(
      { type: state.matchResult.type, hex: state.matchResult.hex, confidence: state.matchResult.confidence, features: state.features, severity: state.severity, routing: state.routing, bodyRegion: state.selectedRegion },
      history
    );

    // Prompt for passphrase
    const passphrase = prompt('Enter a passphrase to encrypt your report (remember this — you will need it to share with your doctor):');
    if (!passphrase) return;

    const encrypted = await encryptReport(report, passphrase);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadAsFile(encrypted, `cancerome-report-${timestamp}.enc.json`);

    // Also offer FHIR bundle (unencrypted, for clinical systems)
    if (confirm('Also download FHIR R4 bundle for clinical import?')) {
      const fhir = generateFHIRBundle(report);
      downloadAsFile(fhir, `cancerome-fhir-${timestamp}.json`);
    }
  });

  document.getElementById('btn-new-scan').addEventListener('click', () => {
    // Reset state
    state.capturedSplotchRGB = null;
    state.correctedRGB = null;
    state.matchResult = null;
    state.selectedRegion = null;
    state.features = null;
    state.severity = null;
    state.routing = null;

    initCamera('calibration-preview');
    showStep('step-calibrate');
  });

  document.getElementById('btn-3d-view').addEventListener('click', async () => {
    const allScans = await getAllScans();
    await renderCancerome('cancerome-3d-container', allScans);
    showStep('step-3d');
  });

  document.getElementById('btn-close-3d').addEventListener('click', () => {
    showStep('step-results');
  });
}
