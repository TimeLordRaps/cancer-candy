/**
 * splotch-analyzer.js — Feature extraction from captured splotch image
 * Extracts: size, intensity, edge gradient, satellite count, fade rate
 */

export function analyzeSplotch(ctx, splotchRGB, thresholdDeltaE) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const threshold = thresholdDeltaE || 40;

  // Find all pixels that are "splotch colored" (within threshold of detected color)
  const splotchPixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = Math.sqrt(
        Math.pow(r - splotchRGB.r, 2) +
        Math.pow(g - splotchRGB.g, 2) +
        Math.pow(b - splotchRGB.b, 2)
      );
      if (dist < threshold) {
        splotchPixels.push({ x, y, r, g, b, dist });
      }
    }
  }

  if (splotchPixels.length === 0) {
    return {
      size: 0,
      intensity: 0,
      edgeGradient: 0,
      satelliteCount: 0,
      fadeRate: null,
      pixelCount: 0
    };
  }

  // Size: bounding box diameter (approximate cm based on assumed viewing distance)
  const xs = splotchPixels.map((p) => p.x);
  const ys = splotchPixels.map((p) => p.y);
  const bbox = {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys)
  };
  const diameterPx = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
  // Rough cm estimate: assume 30cm viewing distance, ~50px/cm at that distance
  const sizeCm = diameterPx / 50;

  // Intensity: average color saturation relative to expected
  const avgDist = splotchPixels.reduce((sum, p) => sum + p.dist, 0) / splotchPixels.length;
  const intensity = Math.max(0, 1 - (avgDist / threshold));

  // Edge gradient: ratio of boundary pixels to interior pixels
  const boundaryPixels = splotchPixels.filter((p) => {
    return p.x === bbox.minX || p.x === bbox.maxX ||
           p.y === bbox.minY || p.y === bbox.maxY ||
           p.dist > threshold * 0.7;
  });
  const edgeGradient = 1 - (boundaryPixels.length / splotchPixels.length);

  // Satellite detection: find disconnected clusters
  const clusters = findClusters(splotchPixels, 15);
  const mainCluster = clusters.reduce((a, b) => a.length > b.length ? a : b, []);
  const satelliteCount = clusters.length - 1;

  return {
    size: Math.round(sizeCm * 10) / 10,
    intensity: Math.round(intensity * 100) / 100,
    edgeGradient: Math.round(edgeGradient * 100) / 100,
    satelliteCount,
    fadeRate: null, // Requires two timepoints — set by timeline.js
    pixelCount: splotchPixels.length,
    boundingBox: bbox,
    clusterCount: clusters.length
  };
}

function findClusters(pixels, minDistance) {
  if (pixels.length === 0) return [];

  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < pixels.length; i++) {
    if (visited.has(i)) continue;

    const cluster = [];
    const queue = [i];
    visited.add(i);

    while (queue.length > 0) {
      const idx = queue.shift();
      cluster.push(pixels[idx]);

      for (let j = 0; j < pixels.length; j++) {
        if (visited.has(j)) continue;
        const dx = pixels[idx].x - pixels[j].x;
        const dy = pixels[idx].y - pixels[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
          visited.add(j);
          queue.push(j);
        }
      }
    }

    if (cluster.length >= 3) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

export function compareSplotches(features1, features2, timeDeltaHours) {
  if (!features1 || !features2 || timeDeltaHours <= 0) return null;

  const fadeRate = (features1.intensity - features2.intensity) / timeDeltaHours;
  const sizeChange = features2.size - features1.size;
  const satelliteChange = features2.satelliteCount - features1.satelliteCount;

  return {
    fadeRate: Math.round(fadeRate * 1000) / 1000,
    sizeChangeCm: Math.round(sizeChange * 10) / 10,
    satelliteChange,
    timeDeltaHours,
    isProgressing: sizeChange > 0.5 || satelliteChange > 0
  };
}
