/**
 * camera.js — getUserMedia capture + frame extraction
 * Handles camera access, live preview, and still frame capture for splotch analysis.
 */

let stream = null;
let videoElement = null;

export async function initCamera(previewContainerId) {
  const container = document.getElementById(previewContainerId);
  if (!container) throw new Error(`Container ${previewContainerId} not found`);

  videoElement = document.createElement('video');
  videoElement.setAttribute('autoplay', '');
  videoElement.setAttribute('playsinline', '');
  videoElement.setAttribute('muted', '');
  container.appendChild(videoElement);

  const constraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 960 }
    },
    audio: false
  };

  stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElement.srcObject = stream;
  await videoElement.play();
  return videoElement;
}

export function captureFrame(canvasId) {
  if (!videoElement) throw new Error('Camera not initialized');

  const canvas = canvasId
    ? document.getElementById(canvasId)
    : document.createElement('canvas');

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  return { canvas, ctx };
}

export function getRegionRGB(ctx, x, y, sampleRadius) {
  const radius = sampleRadius || 15;
  const startX = Math.max(0, x - radius);
  const startY = Math.max(0, y - radius);
  const width = radius * 2;
  const height = radius * 2;

  const imageData = ctx.getImageData(startX, startY, width, height);
  const data = imageData.data;

  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    count++;
  }

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count)
  };
}

export function getCenterRGB(ctx) {
  const cx = Math.floor(ctx.canvas.width / 2);
  const cy = Math.floor(ctx.canvas.height / 2);
  return getRegionRGB(ctx, cx, cy, 20);
}

export function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement.remove();
    videoElement = null;
  }
}
