/**
 * severity-scorer.js — Triage scoring from splotch features
 * Scores splotch features against severity-rules.json thresholds.
 */

let severityRules = null;

export async function loadSeverityRules() {
  if (severityRules) return severityRules;
  const response = await fetch('data/severity-rules.json');
  severityRules = await response.json();
  return severityRules;
}

function scoreFeature(value, thresholds) {
  for (const [, config] of Object.entries(thresholds)) {
    const min = config.min ?? -Infinity;
    const max = config.max ?? Infinity;
    if (value >= min && value <= max) {
      return { score: config.score, label: config.interpretation || '' };
    }
  }
  return { score: 0, label: '' };
}

export function calculateSeverity(features, detectedTypeCount) {
  if (!severityRules) throw new Error('Severity rules not loaded');

  const rules = severityRules.features;
  const scores = {};
  let totalScore = 0;

  // Size
  const sizeResult = scoreFeature(features.size, rules.size.thresholds);
  scores.size = sizeResult;
  totalScore += sizeResult.score;

  // Intensity
  const intensityResult = scoreFeature(features.intensity, rules.intensity.thresholds);
  scores.intensity = intensityResult;
  totalScore += intensityResult.score;

  // Edge gradient
  const edgeResult = scoreFeature(features.edgeGradient, rules.edgeGradient.thresholds);
  scores.edge = edgeResult;
  totalScore += edgeResult.score;

  // Satellite count
  const satelliteResult = scoreFeature(features.satelliteCount, rules.satelliteCount.thresholds);
  scores.satellites = satelliteResult;
  totalScore += satelliteResult.score;

  // Fade rate (if available)
  if (features.fadeRate !== null && features.fadeRate !== undefined) {
    const fadeResult = scoreFeature(features.fadeRate, rules.fadeRate.thresholds);
    scores.fadeRate = fadeResult;
    totalScore += fadeResult.score;
  }

  // Multiple cancer types
  if (detectedTypeCount !== undefined) {
    const multiRules = rules.multipleTypes.scoring;
    if (detectedTypeCount >= 3) totalScore += multiRules.multiple.score;
    else if (detectedTypeCount === 2) totalScore += multiRules.dual.score;
  }

  // Determine severity level
  const level = severityRules.severityLevels.find(
    (l) => totalScore >= l.scoreRange[0] && totalScore <= l.scoreRange[1]
  ) || severityRules.severityLevels[severityRules.severityLevels.length - 1];

  return {
    totalScore,
    scores,
    level: level.level,
    color: level.color,
    action: level.action,
    description: level.description,
    disclaimers: severityRules.disclaimers
  };
}
