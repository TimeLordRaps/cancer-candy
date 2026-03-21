/**
 * hex-lookup.js — RGB → hex → cancer type identification
 * Matches measured (and calibrated) RGB values against the 24 cancer type hex database.
 * Uses CIE2000 deltaE for perceptual color distance.
 */

let cancerTypes = null;

export async function loadCancerTypes() {
  if (cancerTypes) return cancerTypes;
  const response = await fetch('data/cancer-types.json');
  const data = await response.json();
  cancerTypes = data;
  return data;
}

export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// sRGB → linear
function linearize(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// RGB → XYZ (D65)
function rgbToXyz(r, g, b) {
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    z: rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041
  };
}

// XYZ → CIELAB
function xyzToLab(x, y, z) {
  const refX = 0.95047, refY = 1.0, refZ = 1.08883;
  const f = (t) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  const fx = f(x / refX);
  const fy = f(y / refY);
  const fz = f(z / refZ);
  return {
    L: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

function rgbToLab(r, g, b) {
  const { x, y, z } = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// CIE2000 deltaE (simplified but accurate implementation)
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;
  const avgC7 = Math.pow(avgC, 7);
  const G = 0.5 * (1 - Math.sqrt(avgC7 / (avgC7 + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  if (h2p < 0) h2p += 360;

  let dhp;
  if (Math.abs(h1p - h2p) <= 180) dhp = h2p - h1p;
  else if (h2p <= h1p) dhp = h2p - h1p + 360;
  else dhp = h2p - h1p - 360;

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let avgHp;
  if (Math.abs(h1p - h2p) <= 180) avgHp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) avgHp = (h1p + h2p + 360) / 2;
  else avgHp = (h1p + h2p - 360) / 2;

  const T = 1
    - 0.17 * Math.cos((avgHp - 30) * Math.PI / 180)
    + 0.24 * Math.cos(2 * avgHp * Math.PI / 180)
    + 0.32 * Math.cos((3 * avgHp + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * avgHp - 63) * Math.PI / 180);

  const SL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;

  const avgCp7 = Math.pow(avgCp, 7);
  const RT = -2 * Math.sqrt(avgCp7 / (avgCp7 + Math.pow(25, 7)))
    * Math.sin(60 * Math.exp(-Math.pow((avgHp - 275) / 25, 2)) * Math.PI / 180);

  return Math.sqrt(
    Math.pow(dLp / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) +
    RT * (dCp / SC) * (dHp / SH)
  );
}

export function matchCancerType(rgb) {
  if (!cancerTypes) throw new Error('Cancer types not loaded. Call loadCancerTypes() first.');

  const measuredLab = rgbToLab(rgb.r, rgb.g, rgb.b);
  const thresholds = cancerTypes.hexColorTolerance;

  const matches = cancerTypes.types.map((type) => {
    const typeLab = rgbToLab(type.rgb[0], type.rgb[1], type.rgb[2]);
    const distance = deltaE2000(measuredLab, typeLab);
    return { ...type, distance };
  }).sort((a, b) => a.distance - b.distance);

  const best = matches[0];

  let confidence;
  if (best.distance <= thresholds.matchThreshold) confidence = 'MATCH';
  else if (best.distance <= thresholds.probableThreshold) confidence = 'PROBABLE';
  else if (best.distance <= thresholds.possibleThreshold) confidence = 'POSSIBLE';
  else confidence = 'NO_MATCH';

  return {
    type: best,
    confidence,
    distance: best.distance,
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    topMatches: matches.slice(0, 3)
  };
}
