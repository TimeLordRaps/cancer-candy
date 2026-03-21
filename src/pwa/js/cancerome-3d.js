/**
 * cancerome-3d.js — Full-body 3D cancerome visualization
 * Renders all detected splotches as colored markers on a body outline.
 * Pure SVG/Canvas — no external 3D library dependencies.
 */

export async function renderCancerome(containerId, scanHistory) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container ${containerId} not found`);

  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 800');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.maxHeight = '70vh';

  // Body outline (anterior view)
  const bodyOutline = `
    <g fill="none" stroke="#333" stroke-width="1.5">
      <!-- Head -->
      <ellipse cx="200" cy="55" rx="40" ry="50" />
      <!-- Neck -->
      <rect x="180" y="105" width="40" height="25" rx="8" />
      <!-- Torso -->
      <rect x="130" y="130" width="140" height="180" rx="15" />
      <!-- Arms -->
      <rect x="70" y="140" width="55" height="160" rx="18" />
      <rect x="275" y="140" width="55" height="160" rx="18" />
      <!-- Pelvis -->
      <rect x="140" y="310" width="120" height="60" rx="15" />
      <!-- Legs -->
      <rect x="145" y="370" width="50" height="200" rx="15" />
      <rect x="205" y="370" width="50" height="200" rx="15" />
      <!-- Feet -->
      <rect x="140" y="570" width="60" height="25" rx="10" />
      <rect x="200" y="570" width="60" height="25" rx="10" />
      <!-- Hands -->
      <rect x="65" y="300" width="30" height="35" rx="8" />
      <rect x="305" y="300" width="30" height="35" rx="8" />
    </g>
  `;

  svg.innerHTML = bodyOutline;

  // Region centers for placing markers
  const regionCenters = {
    'head': { x: 200, y: 55 },
    'head-neck': { x: 200, y: 75 },
    'neck-anterior': { x: 200, y: 117 },
    'chest': { x: 200, y: 170 },
    'thorax': { x: 200, y: 190 },
    'thorax-center': { x: 200, y: 180 },
    'thorax-pleural': { x: 165, y: 185 },
    'axillary': { x: 130, y: 155 },
    'abdomen-upper-right': { x: 230, y: 240 },
    'abdomen-upper-left': { x: 170, y: 240 },
    'abdomen-upper-center': { x: 200, y: 240 },
    'abdomen-lower': { x: 200, y: 280 },
    'abdomen-adrenal': { x: 200, y: 225 },
    'flank': { x: 140, y: 255 },
    'pelvis': { x: 200, y: 335 },
    'pelvis-anterior': { x: 200, y: 325 },
    'pelvis-bilateral': { x: 200, y: 330 },
    'pelvis-center': { x: 200, y: 340 },
    'pelvis-lower': { x: 200, y: 350 },
    'groin': { x: 200, y: 365 },
    'retroperitoneal': { x: 200, y: 300 },
    'extremities': { x: 85, y: 250 },
    'lymph-nodes': { x: 200, y: 200 },
    'lymph-cervical': { x: 200, y: 110 },
    'lymph-pelvic': { x: 200, y: 345 },
    'bone-marrow': { x: 200, y: 400 },
    'spine': { x: 200, y: 250 },
    'skin-any': { x: 200, y: 200 }
  };

  if (!scanHistory || scanHistory.length === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '200');
    text.setAttribute('y', '700');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#666');
    text.textContent = 'No scans recorded yet';
    svg.appendChild(text);
    container.appendChild(svg);
    return;
  }

  // Aggregate: group by cancer type + region, use most recent scan per group
  const groups = new Map();
  for (const scan of scanHistory) {
    const key = `${scan.cancerType}-${scan.bodyRegion}`;
    if (!groups.has(key) || scan.timestamp > groups.get(key).timestamp) {
      groups.set(key, scan);
    }
  }

  for (const [, scan] of groups) {
    const center = regionCenters[scan.bodyRegion] || regionCenters['abdomen-upper-center'];
    const color = scan.hex || '#888';
    const size = Math.max(8, Math.min(30, (scan.features?.size || 2) * 5));

    // Main splotch marker
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', center.x);
    circle.setAttribute('cy', center.y);
    circle.setAttribute('r', size);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', '0.7');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');

    // Pulse animation for high severity
    if (scan.severity?.level === 'HIGH' || scan.severity?.level === 'CRITICAL') {
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'r');
      animate.setAttribute('values', `${size};${size + 5};${size}`);
      animate.setAttribute('dur', '1.5s');
      animate.setAttribute('repeatCount', 'indefinite');
      circle.appendChild(animate);
    }

    svg.appendChild(circle);

    // Satellite markers
    const satellites = scan.features?.satelliteCount || 0;
    for (let i = 0; i < Math.min(satellites, 5); i++) {
      const angle = (i / Math.max(satellites, 1)) * Math.PI * 2;
      const dist = size + 15;
      const sat = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      sat.setAttribute('cx', center.x + Math.cos(angle) * dist);
      sat.setAttribute('cy', center.y + Math.sin(angle) * dist);
      sat.setAttribute('r', 4);
      sat.setAttribute('fill', color);
      sat.setAttribute('fill-opacity', '0.5');
      svg.appendChild(sat);
    }

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', center.x);
    label.setAttribute('y', center.y + size + 14);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#ccc');
    label.setAttribute('font-size', '10');
    label.textContent = scan.cancerType;
    svg.appendChild(label);
  }

  // Legend
  const legendY = 640;
  const legend = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  legend.setAttribute('x', '200');
  legend.setAttribute('y', legendY);
  legend.setAttribute('text-anchor', 'middle');
  legend.setAttribute('fill', '#666');
  legend.setAttribute('font-size', '11');
  legend.textContent = `${groups.size} detection(s) from ${scanHistory.length} scan(s)`;
  svg.appendChild(legend);

  container.appendChild(svg);
}
