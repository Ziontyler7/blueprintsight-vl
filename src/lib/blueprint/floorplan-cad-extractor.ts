/**
 * Gate 1: Architectural CAD / VLM Vector Floorplan Extractor, Client Metadata Scrubber & Live Geometry Override Engine
 * Evaluates spatial vector callouts extracted by NVIDIA NeMo Retriever VLM / NVLM-1.0-72B on Nebius AI Studio.
 */

export type OccupancyClassification = 'B_HEALTHCARE_CLINIC' | 'B_E_ACADEMIC_LAB' | 'A2_ASSEMBLY_DINING' | 'S1_INDUSTRIAL_WAREHOUSE';

export interface SpatialZone {
  zoneId: string;
  label: string;
  category: 'RESTROOM_ACCESSIBLE' | 'EXAM_OR_LAB' | 'CORRIDOR_PRIMARY' | 'ASSEMBLY_HALL' | 'VESTIBULE_SERVICE' | 'MEZZANINE_FLOOR';
  /** Normalized SVG coordinates (0..800 x, 0..480 y) */
  bbox: { x: number; y: number; width: number; height: number };
  occupantLoad: number;
  turningCircleDiameterIn: number;
  minDoorClearWidthIn: number;
  maneuveringPullLatchIn: number;
  remotePointToExitFt: number;
  commonPathOfTravelFt: number;
  deadEndCorridorLengthFt: number;
  nearestExitId: 'EXIT-NORTH-A' | 'EXIT-SOUTH-B';
  vlmConfidence: number;
}

export interface ExteriorExitDoor {
  exitId: 'EXIT-NORTH-A' | 'EXIT-SOUTH-B';
  label: string;
  x: number;
  y: number;
  clearLeafWidthIn: number;
  panicHardwareRated: boolean;
}

export interface BlueprintWhatIfOverrides {
  turningCircleDiameterIn?: number;
  minDoorClearWidthIn?: number;
  primaryCorridorWidthIn?: number;
  maxExitTravelDistanceFt?: number;
  commonPathOfTravelFt?: number;
  isNfpa13Sprinklered?: boolean;
}

export interface BlueprintFloorplanCase {
  blueprintId: string;
  sheetNumber: string;
  title: string;
  occupancyGroup: OccupancyClassification;
  occupancyLabel: string;
  grossAreaSqFt: number;
  totalOccupantLoad: number;
  isNfpa13Sprinklered: boolean;
  primaryCorridorWidthIn: number;
  minDoorClearWidthIn: number;
  minTurningCircleDiameterIn: number;
  maxExitTravelDistanceFt: number;
  maxCommonPathOfTravelFt: number;
  maxDeadEndCorridorFt: number;
  rawTitleBlockText: string;
  zones: SpatialZone[];
  exits: ExteriorExitDoor[];
}

export interface ScrubbedTitleBlockResult {
  blueprintId: string;
  scrubbedText: string;
  redactedEntities: string[];
  redactionCount: number;
  zeroMetadataLeakVerified: boolean;
}

export const BLUEPRINT_FLOORPLAN_CORPUS: readonly BlueprintFloorplanCase[] = [
  {
    blueprintId: 'BP-MED-101',
    sheetNumber: 'A-101.4',
    title: 'Bayview Ambulatory Surgical & Diagnostic Clinic (Suite 200)',
    occupancyGroup: 'B_HEALTHCARE_CLINIC',
    occupancyLabel: 'IBC Group B / Ambulatory Care (Outpatient)',
    grossAreaSqFt: 11400,
    totalOccupantLoad: 96,
    isNfpa13Sprinklered: true,
    primaryCorridorWidthIn: 48.0,
    minDoorClearWidthIn: 30.5, // Violation: < 32.0" ADA §404.2.3
    minTurningCircleDiameterIn: 56.0, // Violation: < 60.0" ADA §304.3.1
    maxExitTravelDistanceFt: 164.0,
    maxCommonPathOfTravelFt: 58.0,
    maxDeadEndCorridorFt: 16.0,
    rawTitleBlockText:
      'CLIENT: Dr. Harrison Vance, MD | PARCEL: 4420 Geary Blvd, San Francisco, CA | TEL: (415) 555-0194 | EMAIL: hvance@bayviewmed.org | SECURITY_VAULT: Narcotics Safe Room 208B Pin-8841 | SHEET A-101.4',
    zones: [
      {
        zoneId: 'ZONE-MED-REST-1',
        label: 'Patient Accessible Restroom 204',
        category: 'RESTROOM_ACCESSIBLE',
        bbox: { x: 60, y: 50, width: 175, height: 145 },
        occupantLoad: 4,
        turningCircleDiameterIn: 56.0,
        minDoorClearWidthIn: 32.5,
        maneuveringPullLatchIn: 18.5,
        remotePointToExitFt: 112.0,
        commonPathOfTravelFt: 42.0,
        deadEndCorridorLengthFt: 12.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.984,
      },
      {
        zoneId: 'ZONE-MED-EXAM-2',
        label: 'Fluoroscopy & Procedure Suite 210',
        category: 'EXAM_OR_LAB',
        bbox: { x: 265, y: 50, width: 235, height: 145 },
        occupantLoad: 24,
        turningCircleDiameterIn: 62.0,
        minDoorClearWidthIn: 30.5,
        maneuveringPullLatchIn: 14.0,
        remotePointToExitFt: 164.0,
        commonPathOfTravelFt: 58.0,
        deadEndCorridorLengthFt: 16.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.979,
      },
      {
        zoneId: 'ZONE-MED-CORR-3',
        label: 'Main Clinical Spine Corridor C-200',
        category: 'CORRIDOR_PRIMARY',
        bbox: { x: 60, y: 215, width: 680, height: 85 },
        occupantLoad: 48,
        turningCircleDiameterIn: 60.0,
        minDoorClearWidthIn: 36.0,
        maneuveringPullLatchIn: 20.0,
        remotePointToExitFt: 128.0,
        commonPathOfTravelFt: 38.0,
        deadEndCorridorLengthFt: 14.0,
        nearestExitId: 'EXIT-SOUTH-B',
        vlmConfidence: 0.992,
      },
      {
        zoneId: 'ZONE-MED-RECOVERY-4',
        label: 'Post-Anesthesia Recovery Bay 220',
        category: 'EXAM_OR_LAB',
        bbox: { x: 525, y: 50, width: 215, height: 145 },
        occupantLoad: 20,
        turningCircleDiameterIn: 64.0,
        minDoorClearWidthIn: 36.0,
        maneuveringPullLatchIn: 19.0,
        remotePointToExitFt: 148.0,
        commonPathOfTravelFt: 49.0,
        deadEndCorridorLengthFt: 10.0,
        nearestExitId: 'EXIT-SOUTH-B',
        vlmConfidence: 0.988,
      },
    ],
    exits: [
      {
        exitId: 'EXIT-NORTH-A',
        label: 'North Pressurized Stairwell Exit A',
        x: 45,
        y: 255,
        clearLeafWidthIn: 42.0,
        panicHardwareRated: true,
      },
      {
        exitId: 'EXIT-SOUTH-B',
        label: 'South Exterior Grade Exit B',
        x: 755,
        y: 255,
        clearLeafWidthIn: 44.0,
        panicHardwareRated: true,
      },
    ],
  },
  {
    blueprintId: 'BP-STEM-204',
    sheetNumber: 'A-204.2',
    title: 'Northgate University Robotics & Wet Synthesis Lab Wing',
    occupancyGroup: 'B_E_ACADEMIC_LAB',
    occupancyLabel: 'IBC Group B / E University Laboratory',
    grossAreaSqFt: 16800,
    totalOccupantLoad: 142,
    isNfpa13Sprinklered: false, // Unsprinklered renovation wing -> 200 ft max travel distance!
    primaryCorridorWidthIn: 39.0, // Violation: < 44.0" required for >= 50 occupants (IBC §1020.2)
    minDoorClearWidthIn: 34.0,
    minTurningCircleDiameterIn: 62.0,
    maxExitTravelDistanceFt: 238.0, // Violation when unsprinklered (limit 200 ft; 300 ft if sprinklered)
    maxCommonPathOfTravelFt: 68.0,
    maxDeadEndCorridorFt: 24.0, // Violation when unsprinklered (limit 20 ft; 50 ft if sprinklered)
    rawTitleBlockText:
      'CLIENT: Provost Elena Rostova | PARCEL: 1900 Euclid Ave, Suite 400 | TEL: (312) 555-0148 | EMAIL: erostova@northgate.edu | SECURITY_VAULT: Isotope Storage Vault R-409 | SHEET A-204.2',
    zones: [
      {
        zoneId: 'ZONE-STEM-WETLAB-1',
        label: 'Autonomous Polymer Wet Lab 302',
        category: 'EXAM_OR_LAB',
        bbox: { x: 60, y: 45, width: 310, height: 155 },
        occupantLoad: 58,
        turningCircleDiameterIn: 62.0,
        minDoorClearWidthIn: 34.0,
        maneuveringPullLatchIn: 18.0,
        remotePointToExitFt: 238.0,
        commonPathOfTravelFt: 68.0,
        deadEndCorridorLengthFt: 24.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.981,
      },
      {
        zoneId: 'ZONE-STEM-ROBOTICS-2',
        label: 'Humanoid Kinematics Test Arena 310',
        category: 'EXAM_OR_LAB',
        bbox: { x: 400, y: 45, width: 340, height: 155 },
        occupantLoad: 64,
        turningCircleDiameterIn: 68.0,
        minDoorClearWidthIn: 36.0,
        maneuveringPullLatchIn: 22.0,
        remotePointToExitFt: 195.0,
        commonPathOfTravelFt: 54.0,
        deadEndCorridorLengthFt: 15.0,
        nearestExitId: 'EXIT-SOUTH-B',
        vlmConfidence: 0.991,
      },
      {
        zoneId: 'ZONE-STEM-CORR-3',
        label: 'Equipment Alcove Pinch Corridor C-301',
        category: 'CORRIDOR_PRIMARY',
        bbox: { x: 60, y: 220, width: 680, height: 75 },
        occupantLoad: 20,
        turningCircleDiameterIn: 62.0,
        minDoorClearWidthIn: 34.0,
        maneuveringPullLatchIn: 18.0,
        remotePointToExitFt: 170.0,
        commonPathOfTravelFt: 45.0,
        deadEndCorridorLengthFt: 24.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.976,
      },
    ],
    exits: [
      {
        exitId: 'EXIT-NORTH-A',
        label: 'West Fire Tower Stairwell A',
        x: 45,
        y: 255,
        clearLeafWidthIn: 44.0,
        panicHardwareRated: true,
      },
      {
        exitId: 'EXIT-SOUTH-B',
        label: 'East Courtyard Fire Exit B',
        x: 755,
        y: 255,
        clearLeafWidthIn: 44.0,
        panicHardwareRated: true,
      },
    ],
  },
  {
    blueprintId: 'BP-HOSP-309',
    sheetNumber: 'A-309.1',
    title: 'Solstice Grand Atrium Food Hall & Mezzanine Lounge',
    occupancyGroup: 'A2_ASSEMBLY_DINING',
    occupancyLabel: 'IBC Group A-2 Assembly (Banquet & Food Hall)',
    grossAreaSqFt: 19500,
    totalOccupantLoad: 340,
    isNfpa13Sprinklered: true,
    primaryCorridorWidthIn: 52.0,
    minDoorClearWidthIn: 31.0, // Violation: 31.0" < 32.0" ADA §404.2.3
    minTurningCircleDiameterIn: 58.5, // Violation: 58.5" < 60.0" ADA §304.3.1
    maxExitTravelDistanceFt: 218.0, // Compliant with 250 ft sprinklered A-2 limit
    maxCommonPathOfTravelFt: 92.0, // Violation: > 75.0 ft NFPA 101 §12.2.5.1.2 common path limit
    maxDeadEndCorridorFt: 18.0,
    rawTitleBlockText:
      'CLIENT: Marcus Sterling Hospitality LLC | PARCEL: 880 Congress Ave, Austin, TX | TEL: (512) 555-0177 | EMAIL: msterling@solsticeatrium.com | SECURITY_VAULT: Cash Drop Room B-12 | SHEET A-309.1',
    zones: [
      {
        zoneId: 'ZONE-HOSP-DINING-1',
        label: 'Main Atrium Dining Floor 101',
        category: 'ASSEMBLY_HALL',
        bbox: { x: 60, y: 45, width: 420, height: 155 },
        occupantLoad: 240,
        turningCircleDiameterIn: 64.0,
        minDoorClearWidthIn: 36.0,
        maneuveringPullLatchIn: 20.0,
        remotePointToExitFt: 184.0,
        commonPathOfTravelFt: 62.0,
        deadEndCorridorLengthFt: 14.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.989,
      },
      {
        zoneId: 'ZONE-HOSP-MEZZ-2',
        label: 'VIP Mezzanine Tasting Gallery 202',
        category: 'VESTIBULE_SERVICE',
        bbox: { x: 505, y: 45, width: 235, height: 155 },
        occupantLoad: 75,
        turningCircleDiameterIn: 58.5,
        minDoorClearWidthIn: 31.0,
        maneuveringPullLatchIn: 15.0,
        remotePointToExitFt: 218.0,
        commonPathOfTravelFt: 92.0,
        deadEndCorridorLengthFt: 18.0,
        nearestExitId: 'EXIT-SOUTH-B',
        vlmConfidence: 0.974,
      },
      {
        zoneId: 'ZONE-HOSP-CORR-3',
        label: 'South Egress Concourse C-105',
        category: 'CORRIDOR_PRIMARY',
        bbox: { x: 60, y: 220, width: 680, height: 80 },
        occupantLoad: 25,
        turningCircleDiameterIn: 66.0,
        minDoorClearWidthIn: 36.0,
        maneuveringPullLatchIn: 24.0,
        remotePointToExitFt: 140.0,
        commonPathOfTravelFt: 48.0,
        deadEndCorridorLengthFt: 12.0,
        nearestExitId: 'EXIT-SOUTH-B',
        vlmConfidence: 0.993,
      },
    ],
    exits: [
      {
        exitId: 'EXIT-NORTH-A',
        label: 'North Grand Vestibule Exit A',
        x: 45,
        y: 255,
        clearLeafWidthIn: 72.0,
        panicHardwareRated: true,
      },
      {
        exitId: 'EXIT-SOUTH-B',
        label: 'South Alley Panic Exit B',
        x: 755,
        y: 255,
        clearLeafWidthIn: 48.0,
        panicHardwareRated: true,
      },
    ],
  },
  {
    blueprintId: 'BP-IND-412',
    sheetNumber: 'A-412.0',
    title: 'Meridian Automated Cold-Chain Logistics & QA Hub (Baseline Compliant)',
    occupancyGroup: 'S1_INDUSTRIAL_WAREHOUSE',
    occupancyLabel: 'IBC Group S-1 Moderate-Hazard Storage & QA',
    grossAreaSqFt: 24000,
    totalOccupantLoad: 68,
    isNfpa13Sprinklered: true,
    primaryCorridorWidthIn: 56.0,
    minDoorClearWidthIn: 38.0,
    minTurningCircleDiameterIn: 68.0,
    maxExitTravelDistanceFt: 172.0,
    maxCommonPathOfTravelFt: 54.0,
    maxDeadEndCorridorFt: 14.0,
    rawTitleBlockText:
      'CLIENT: Meridian Logistics Corp | PARCEL: 7200 Harbor Way, Oakland, CA | TEL: (510) 555-0162 | EMAIL: facilities@meridianhub.io | SECURITY_VAULT: Server Cage IDF-04 | SHEET A-412.0',
    zones: [
      {
        zoneId: 'ZONE-IND-REST-1',
        label: 'Universal ADA Locker & Restroom Core 102',
        category: 'RESTROOM_ACCESSIBLE',
        bbox: { x: 60, y: 45, width: 210, height: 155 },
        occupantLoad: 12,
        turningCircleDiameterIn: 68.0,
        minDoorClearWidthIn: 38.0,
        maneuveringPullLatchIn: 22.0,
        remotePointToExitFt: 118.0,
        commonPathOfTravelFt: 38.0,
        deadEndCorridorLengthFt: 10.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.995,
      },
      {
        zoneId: 'ZONE-IND-FLOOR-2',
        label: 'Automated ASRS Picking Mezzanine 110',
        category: 'MEZZANINE_FLOOR',
        bbox: { x: 295, y: 45, width: 445, height: 155 },
        occupantLoad: 40,
        turningCircleDiameterIn: 72.0,
        minDoorClearWidthIn: 40.0,
        maneuveringPullLatchIn: 24.0,
        remotePointToExitFt: 172.0,
        commonPathOfTravelFt: 54.0,
        deadEndCorridorLengthFt: 14.0,
        nearestExitId: 'EXIT-SOUTH-B',
        vlmConfidence: 0.991,
      },
      {
        zoneId: 'ZONE-IND-CORR-3',
        label: 'Protected Perimeter Egress Spine C-100',
        category: 'CORRIDOR_PRIMARY',
        bbox: { x: 60, y: 220, width: 680, height: 80 },
        occupantLoad: 16,
        turningCircleDiameterIn: 68.0,
        minDoorClearWidthIn: 38.0,
        maneuveringPullLatchIn: 22.0,
        remotePointToExitFt: 135.0,
        commonPathOfTravelFt: 42.0,
        deadEndCorridorLengthFt: 12.0,
        nearestExitId: 'EXIT-NORTH-A',
        vlmConfidence: 0.996,
      },
    ],
    exits: [
      {
        exitId: 'EXIT-NORTH-A',
        label: 'North Dock Grade Exit A',
        x: 45,
        y: 255,
        clearLeafWidthIn: 48.0,
        panicHardwareRated: true,
      },
      {
        exitId: 'EXIT-SOUTH-B',
        label: 'South Yard Grade Exit B',
        x: 755,
        y: 255,
        clearLeafWidthIn: 48.0,
        panicHardwareRated: true,
      },
    ],
  },
];

export function getBlueprintCaseById(blueprintId: string): BlueprintFloorplanCase {
  const match = BLUEPRINT_FLOORPLAN_CORPUS.find((item) => item.blueprintId === blueprintId);
  return match ?? BLUEPRINT_FLOORPLAN_CORPUS[0];
}

/**
 * Scrubs sensitive client PII, parcel street addresses, contact phone/email, and security vault/IDF room coordinates
 * from architectural title-block metadata prior to cloud VLM serialization.
 */
export function scrubTitleBlockMetadata(blueprint: BlueprintFloorplanCase): ScrubbedTitleBlockResult {
  const redactedEntities: string[] = [];
  let text = blueprint.rawTitleBlockText;

  const patterns: Array<{ label: string; regex: RegExp; replacement: string }> = [
    {
      label: 'CLIENT_OWNER_NAME',
      regex: /CLIENT:\s*[^|]+/gi,
      replacement: 'CLIENT: [REDACTED_CLIENT_ENTITY] ',
    },
    {
      label: 'PARCEL_STREET_ADDRESS',
      regex: /PARCEL:\s*[^|]+/gi,
      replacement: 'PARCEL: [REDACTED_SITE_PARCEL] ',
    },
    {
      label: 'CONTACT_PHONE',
      regex: /\(\d{3}\)\s*\d{3}-\d{4}/g,
      replacement: '[REDACTED_PHONE]',
    },
    {
      label: 'CONTACT_EMAIL',
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      replacement: '[REDACTED_EMAIL]',
    },
    {
      label: 'SECURITY_VAULT_LOCATION',
      regex: /SECURITY_VAULT:\s*[^|]+/gi,
      replacement: 'SECURITY_VAULT: [REDACTED_SECURITY_ZONE] ',
    },
  ];

  for (const p of patterns) {
    if (p.regex.test(text)) {
      redactedEntities.push(p.label);
      text = text.replace(p.regex, p.replacement);
    }
  }

  return {
    blueprintId: blueprint.blueprintId,
    scrubbedText: text.trim(),
    redactedEntities,
    redactionCount: redactedEntities.length,
    zeroMetadataLeakVerified: verifyZeroMetadataLeakage(text),
  };
}

export function verifyZeroMetadataLeakage(scrubbedText: string): boolean {
  const hasPhone = /\(\d{3}\)\s*\d{3}-\d{4}/.test(scrubbedText);
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(scrubbedText);
  const hasStreetAddress = /\b\d{3,5}\s+(Geary|Euclid|Congress|Harbor)\b/i.test(scrubbedText);
  const hasVaultSecret = /\b(Narcotics Safe|Isotope Storage|Cash Drop|Server Cage)\b/i.test(scrubbedText);
  return !hasPhone && !hasEmail && !hasStreetAddress && !hasVaultSecret;
}

function clampNumber(val: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof val !== 'number' || Number.isNaN(val)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Number(val.toFixed(1))));
}

/**
 * Applies interactive CAD What-If geometric overrides to a blueprint scenario in pure memory.
 */
export function applyBlueprintWhatIfOverrides(
  baseCase: BlueprintFloorplanCase,
  overrides: BlueprintWhatIfOverrides
): BlueprintFloorplanCase {
  const minTurningCircleDiameterIn = clampNumber(
    overrides.turningCircleDiameterIn,
    baseCase.minTurningCircleDiameterIn,
    36.0,
    96.0
  );
  const minDoorClearWidthIn = clampNumber(
    overrides.minDoorClearWidthIn,
    baseCase.minDoorClearWidthIn,
    24.0,
    60.0
  );
  const primaryCorridorWidthIn = clampNumber(
    overrides.primaryCorridorWidthIn,
    baseCase.primaryCorridorWidthIn,
    24.0,
    96.0
  );
  const maxExitTravelDistanceFt = clampNumber(
    overrides.maxExitTravelDistanceFt,
    baseCase.maxExitTravelDistanceFt,
    50.0,
    450.0
  );
  const maxCommonPathOfTravelFt = clampNumber(
    overrides.commonPathOfTravelFt,
    baseCase.maxCommonPathOfTravelFt,
    20.0,
    180.0
  );
  const isNfpa13Sprinklered =
    typeof overrides.isNfpa13Sprinklered === 'boolean'
      ? overrides.isNfpa13Sprinklered
      : baseCase.isNfpa13Sprinklered;

  const updatedZones: SpatialZone[] = baseCase.zones.map((zone, idx) => {
    const isCriticalTurningZone = idx === 0 || zone.turningCircleDiameterIn <= baseCase.minTurningCircleDiameterIn;
    const isCriticalDoorZone = idx === 1 || zone.minDoorClearWidthIn <= baseCase.minDoorClearWidthIn;
    const isMaxTravelZone = zone.remotePointToExitFt >= baseCase.maxExitTravelDistanceFt;

    return {
      ...zone,
      turningCircleDiameterIn: isCriticalTurningZone
        ? minTurningCircleDiameterIn
        : Math.max(zone.turningCircleDiameterIn, minTurningCircleDiameterIn),
      minDoorClearWidthIn: isCriticalDoorZone
        ? minDoorClearWidthIn
        : Math.max(zone.minDoorClearWidthIn, minDoorClearWidthIn),
      maneuveringPullLatchIn: minDoorClearWidthIn >= 32.0 ? Math.max(18.0, zone.maneuveringPullLatchIn) : zone.maneuveringPullLatchIn,
      remotePointToExitFt: isMaxTravelZone
        ? maxExitTravelDistanceFt
        : Math.min(zone.remotePointToExitFt, maxExitTravelDistanceFt),
      commonPathOfTravelFt: isMaxTravelZone
        ? maxCommonPathOfTravelFt
        : Math.min(zone.commonPathOfTravelFt, maxCommonPathOfTravelFt),
    };
  });

  return {
    ...baseCase,
    isNfpa13Sprinklered,
    primaryCorridorWidthIn,
    minDoorClearWidthIn,
    minTurningCircleDiameterIn,
    maxExitTravelDistanceFt,
    maxCommonPathOfTravelFt,
    zones: updatedZones,
  };
}
