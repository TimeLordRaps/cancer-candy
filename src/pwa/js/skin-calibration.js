/**
 * skin-calibration.js — Fitzpatrick I-VI melanin offset correction
 * Captures a reference patch of unaffected skin, determines Fitzpatrick type,
 * and applies subtractive correction to splotch RGB readings.
 */

let calibrationData = null;
let activeCorrectionOffset = { r: 0, g: 0, b: 0 };
let detectedType = null;

export async function loadCalibrationData() {
  if (calibrationData) return calibrationData;
  const response = await fetch('data/fitzpatrick-calibration.json');
  calibrationData = await response.json();
  return calibrationData;
}

function rgbDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b[0], 2) +
    Math.pow(a.g - b[1], 2) +
    Math.pow(a.b - b[2], 2)
  );
}

export function detectSkinType(referenceRGB) {
  if (!calibrationData) throw new Error('Calibration data not loaded');

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const type of calibrationData.types) {
    const distance = rgbDistance(referenceRGB, type.baseRGB);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = type;
    }
  }

  detectedType = bestMatch;
  activeCorrectionOffset = bestMatch.correctionOffset;

  return {
    type: bestMatch.type,
    name: bestMatch.name,
    melaninIndex: bestMatch.melaninIndex,
    distance: bestDistance,
    notes: bestMatch.notes
  };
}

export function applyCorrectionToRGB(measuredRGB) {
  return {
    r: Math.max(0, Math.min(255, measuredRGB.r - activeCorrectionOffset.r)),
    g: Math.max(0, Math.min(255, measuredRGB.g - activeCorrectionOffset.g)),
    b: Math.max(0, Math.min(255, measuredRGB.b - activeCorrectionOffset.b))
  };
}

export function getDetectedType() {
  return detectedType;
}

export function getRecommendedMode() {
  if (!detectedType) return 'visible';
  const modes = calibrationData.detectionModes;
  if (modes.visible.bestFor.includes(detectedType.type)) return 'visible';
  if (modes.uvFluorescent.bestFor.includes(detectedType.type)) return 'uv-fluorescent';
  return 'visible';
}

export function resetCalibration() {
  activeCorrectionOffset = { r: 0, g: 0, b: 0 };
  detectedType = null;
}
