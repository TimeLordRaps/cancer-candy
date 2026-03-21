/**
 * body-mapper.js — Anatomical coordinate mapping
 * Maps user-tapped body position to anatomical region and associated cancer types.
 */

let bodyRegions = null;

export async function loadBodyRegions() {
  if (bodyRegions) return bodyRegions;
  const response = await fetch('data/body-regions.json');
  const data = await response.json();
  bodyRegions = data.regions;
  return bodyRegions;
}

export function mapTapToRegion(tapX, tapY, svgWidth, svgHeight) {
  if (!bodyRegions) throw new Error('Body regions not loaded');

  const normX = tapX / svgWidth;
  const normY = tapY / svgHeight;

  const matches = bodyRegions.filter((region) => {
    const { x, y } = region.coordinates;
    return normX >= x[0] && normX <= x[1] && normY >= y[0] && normY <= y[1];
  });

  if (matches.length === 0) return null;

  // Return the most specific region (smallest area)
  matches.sort((a, b) => {
    const areaA = (a.coordinates.x[1] - a.coordinates.x[0]) * (a.coordinates.y[1] - a.coordinates.y[0]);
    const areaB = (b.coordinates.x[1] - b.coordinates.x[0]) * (b.coordinates.y[1] - b.coordinates.y[0]);
    return areaA - areaB;
  });

  return matches[0];
}

export function getRegionById(regionId) {
  if (!bodyRegions) throw new Error('Body regions not loaded');
  return bodyRegions.find((r) => r.id === regionId) || null;
}

export function getCancerTypesForRegion(regionId) {
  const region = getRegionById(regionId);
  if (!region) return [];
  return region.associatedCancers;
}

export function crossValidateRegionAndType(regionId, cancerTypeId) {
  const region = getRegionById(regionId);
  if (!region) return { valid: false, reason: 'Unknown region' };

  if (region.associatedCancers.includes(cancerTypeId)) {
    return { valid: true, reason: 'Cancer type matches expected region' };
  }

  // Check if this region could be a metastatic site
  return {
    valid: true,
    reason: 'Cancer type not primary for this region — may indicate metastatic spread',
    warning: true
  };
}
