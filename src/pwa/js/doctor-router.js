/**
 * doctor-router.js — Cancer type → specialist routing
 * Routes detected cancer type to the appropriate medical specialist.
 */

let specialistData = null;

export async function loadSpecialists() {
  if (specialistData) return specialistData;
  const response = await fetch('data/specialist-types.json');
  specialistData = await response.json();
  return specialistData;
}

export function routeToSpecialist(cancerTypeId, severityLevel, patientAge) {
  if (!specialistData) throw new Error('Specialist data not loaded');

  // Check emergency triggers first
  const emergency = checkEmergencyTriggers(cancerTypeId, severityLevel, patientAge);
  if (emergency) {
    return {
      specialist: null,
      emergency: true,
      action: emergency.action,
      reason: emergency.reason
    };
  }

  const specialist = specialistData.specialists.find(
    (s) => s.cancerTypes.includes(cancerTypeId)
  );

  if (!specialist) {
    return {
      specialist: null,
      emergency: false,
      action: 'Consult general oncologist — cancer type routing not found in database',
      reason: 'No specialist mapping for this cancer type'
    };
  }

  return {
    specialist: {
      id: specialist.id,
      title: specialist.title,
      urgencyNote: specialist.urgencyNote
    },
    emergency: false,
    action: `Refer to ${specialist.title}`,
    reason: `Matched cancer type: ${cancerTypeId}`
  };
}

function checkEmergencyTriggers(cancerTypeId, severityLevel, patientAge) {
  if (severityLevel === 'CRITICAL') {
    return {
      action: 'EMERGENCY — Seek immediate medical attention',
      reason: 'CRITICAL severity score'
    };
  }

  if (cancerTypeId === 'brain-cns') {
    return {
      action: 'URGENT — Brain/CNS detection requires immediate imaging',
      reason: 'Brain/CNS detection in any patient'
    };
  }

  if (patientAge !== undefined && patientAge < 18) {
    return {
      action: 'URGENT — Pediatric oncology referral required immediately',
      reason: 'Cancer detection in patient under 18'
    };
  }

  return null;
}

export function getEmergencyTriggers() {
  if (!specialistData) return [];
  return specialistData.emergencyTriggers.triggers;
}
