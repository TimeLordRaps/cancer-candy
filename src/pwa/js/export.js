/**
 * export.js — Encrypted PDF + FHIR R4 bundle export
 * Patient-controlled export: data never leaves the phone until the user decides.
 * Uses Web Crypto API for AES-256-GCM encryption.
 */

export async function generateReport(scanResult, scanHistory) {
  const report = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    generator: 'CanceromeScanner PWA',
    disclaimer: 'This is a screening aid, not a clinical diagnosis. All findings require confirmation via imaging and biopsy.',
    detection: {
      cancerType: scanResult.type?.name || 'Unknown',
      cancerTypeId: scanResult.type?.id || 'unknown',
      hex: scanResult.hex,
      confidence: scanResult.confidence,
      distance: scanResult.distance
    },
    features: scanResult.features,
    severity: scanResult.severity,
    specialist: scanResult.routing,
    bodyRegion: scanResult.bodyRegion,
    scanHistory: scanHistory?.map((s) => ({
      timestamp: new Date(s.timestamp).toISOString(),
      cancerType: s.cancerType,
      severity: s.severity?.level,
      size: s.features?.size
    })) || []
  };

  return report;
}

export function generateFHIRBundle(report) {
  // FHIR R4 DiagnosticReport bundle
  const bundle = {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: report.generated,
    entry: [
      {
        resource: {
          resourceType: 'DiagnosticReport',
          status: 'preliminary',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '24604-1',
              display: 'Cancer screening panel'
            }],
            text: 'CanceromeScanner Splotch Analysis'
          },
          issued: report.generated,
          conclusion: `Detected: ${report.detection.cancerType} (${report.detection.confidence}). `
            + `Severity: ${report.severity?.level || 'UNKNOWN'}. `
            + `Action: ${report.severity?.action || 'Consult oncologist.'}`,
          presentedForm: [{
            contentType: 'application/json',
            data: btoa(JSON.stringify(report))
          }]
        }
      },
      {
        resource: {
          resourceType: 'Observation',
          status: 'preliminary',
          code: {
            text: 'Splotch hex color'
          },
          valueString: report.detection.hex
        }
      },
      {
        resource: {
          resourceType: 'Observation',
          status: 'preliminary',
          code: {
            text: 'Splotch size (cm)'
          },
          valueQuantity: {
            value: report.features?.size || 0,
            unit: 'cm'
          }
        }
      }
    ]
  };

  return bundle;
}

export async function encryptReport(report, passphrase) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(report));

  // Derive key from passphrase using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Package: salt + iv + ciphertext (all base64)
  const package_ = {
    version: '1.0.0',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256-100000',
    salt: arrayToBase64(salt),
    iv: arrayToBase64(iv),
    ciphertext: arrayToBase64(new Uint8Array(encrypted))
  };

  return package_;
}

export async function decryptReport(encryptedPackage, passphrase) {
  const encoder = new TextEncoder();
  const salt = base64ToArray(encryptedPackage.salt);
  const iv = base64ToArray(encryptedPackage.iv);
  const ciphertext = base64ToArray(encryptedPackage.ciphertext);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

export function downloadAsFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function arrayToBase64(arr) {
  return btoa(String.fromCharCode(...arr));
}

function base64ToArray(b64) {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}
