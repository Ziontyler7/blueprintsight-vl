/**
 * Gate 3: NFPA 101 Life Safety Code & IBC Table 1017.2 Egress Travel Distance & Manhattan Pathfinder
 * Evaluates maximum travel distance to exterior exit, Common Path of Travel, Dead-End Corridor length,
 * and IBC §1005.3.2 occupant egress width capacity across sprinklered vs. unsprinklered envelopes.
 */

import type { BlueprintFloorplanCase, OccupancyClassification } from '../blueprint/floorplan-cad-extractor.ts';

export interface NfpaStatutoryLimits {
  maxExitTravelDistanceFt: number;
  maxCommonPathOfTravelFt: number;
  maxDeadEndCorridorFt: number;
  codeReference: string;
}

export interface EgressZonePath {
  zoneId: string;
  zoneLabel: string;
  nearestExitId: string;
  nearestExitLabel: string;
  manhattanWaypoints: Array<{ x: number; y: number }>;
  travelDistanceFt: number;
  maxAllowedTravelFt: number;
  commonPathFt: number;
  maxAllowedCommonPathFt: number;
  passed: boolean;
}

export interface NfpaEgressRuleCheck {
  checkId: string;
  codeCitation: string;
  title: string;
  measuredValue: number;
  statutoryLimit: number;
  unit: 'ft' | 'occupants';
  passed: boolean;
  remediationDirective: string;
}

export type NfpaEgressVerdict = 'NFPA101_LIFE_SAFETY_COMPLIANT' | 'NFPA101_EGRESS_VIOLATION_HOLD';

export interface Nfpa101EgressAuditResult {
  blueprintId: string;
  isNfpa13Sprinklered: boolean;
  verdict: NfpaEgressVerdict;
  egressSafetyScorePct: number;
  statutoryLimits: NfpaStatutoryLimits;
  totalExitCapacityOccupants: number;
  requiredOccupantLoad: number;
  zonePaths: EgressZonePath[];
  checks: NfpaEgressRuleCheck[];
  blockingViolations: NfpaEgressRuleCheck[];
}

export function getNfpa101StatutoryLimits(
  occupancy: OccupancyClassification,
  isSprinklered: boolean
): NfpaStatutoryLimits {
  switch (occupancy) {
    case 'B_HEALTHCARE_CLINIC':
      return {
        maxExitTravelDistanceFt: isSprinklered ? 250.0 : 150.0,
        maxCommonPathOfTravelFt: isSprinklered ? 100.0 : 75.0,
        maxDeadEndCorridorFt: isSprinklered ? 50.0 : 20.0,
        codeReference: 'NFPA 101 §38.2.6 / §20.2.6 & IBC Table 1017.2 (Ambulatory Healthcare / Group B)',
      };
    case 'B_E_ACADEMIC_LAB':
      return {
        maxExitTravelDistanceFt: isSprinklered ? 300.0 : 200.0,
        maxCommonPathOfTravelFt: isSprinklered ? 100.0 : 75.0,
        maxDeadEndCorridorFt: isSprinklered ? 50.0 : 20.0,
        codeReference: 'NFPA 101 §38.2.6 & IBC Table 1017.2 (Group B / Educational Laboratory)',
      };
    case 'A2_ASSEMBLY_DINING':
      return {
        maxExitTravelDistanceFt: isSprinklered ? 250.0 : 200.0,
        maxCommonPathOfTravelFt: isSprinklered ? 75.0 : 20.0,
        maxDeadEndCorridorFt: 20.0,
        codeReference: 'NFPA 101 §12.2.6 / §12.2.5.1.2 & IBC Table 1017.2 (Group A-2 Assembly)',
      };
    case 'S1_INDUSTRIAL_WAREHOUSE':
      return {
        maxExitTravelDistanceFt: isSprinklered ? 250.0 : 200.0,
        maxCommonPathOfTravelFt: isSprinklered ? 100.0 : 75.0,
        maxDeadEndCorridorFt: isSprinklered ? 50.0 : 20.0,
        codeReference: 'NFPA 101 §42.2.6 & IBC Table 1017.2 (Group S-1 Storage)',
      };
  }
}

export function auditNfpa101Egress(blueprint: BlueprintFloorplanCase): Nfpa101EgressAuditResult {
  const limits = getNfpa101StatutoryLimits(blueprint.occupancyGroup, blueprint.isNfpa13Sprinklered);

  const corridorY = 255;
  const zonePaths: EgressZonePath[] = blueprint.zones.map((zone) => {
    const exitDoor =
      blueprint.exits.find((e) => e.exitId === zone.nearestExitId) ?? blueprint.exits[0];
    const centerX = Math.round(zone.bbox.x + zone.bbox.width / 2);
    const centerY = Math.round(zone.bbox.y + zone.bbox.height / 2);

    const waypoints = [
      { x: centerX, y: centerY },
      { x: centerX, y: corridorY },
      { x: exitDoor.x, y: exitDoor.y },
    ];

    const travelPassed = zone.remotePointToExitFt <= limits.maxExitTravelDistanceFt;
    const commonPassed = zone.commonPathOfTravelFt <= limits.maxCommonPathOfTravelFt;

    return {
      zoneId: zone.zoneId,
      zoneLabel: zone.label,
      nearestExitId: exitDoor.exitId,
      nearestExitLabel: exitDoor.label,
      manhattanWaypoints: waypoints,
      travelDistanceFt: zone.remotePointToExitFt,
      maxAllowedTravelFt: limits.maxExitTravelDistanceFt,
      commonPathFt: zone.commonPathOfTravelFt,
      maxAllowedCommonPathFt: limits.maxCommonPathOfTravelFt,
      passed: travelPassed && commonPassed,
    };
  });

  // IBC §1005.3.2 capacity factor: 0.2 inches per occupant for level egress components (doors)
  const totalExitDoorClearIn = blueprint.exits.reduce((sum, e) => sum + e.clearLeafWidthIn, 0);
  const totalExitCapacityOccupants = Math.floor(totalExitDoorClearIn / 0.2);

  const checks: NfpaEgressRuleCheck[] = [
    {
      checkId: 'NFPA101-7.6-TRAVEL-DIST',
      codeCitation: limits.codeReference,
      title: `Maximum Exit Access Travel Distance (${blueprint.isNfpa13Sprinklered ? 'NFPA 13 Sprinklered' : 'Unsprinklered'})`,
      measuredValue: blueprint.maxExitTravelDistanceFt,
      statutoryLimit: limits.maxExitTravelDistanceFt,
      unit: 'ft',
      passed: blueprint.maxExitTravelDistanceFt <= limits.maxExitTravelDistanceFt,
      remediationDirective:
        blueprint.maxExitTravelDistanceFt <= limits.maxExitTravelDistanceFt
          ? `Remote travel path (${blueprint.maxExitTravelDistanceFt.toFixed(1)} ft) is within ${limits.maxExitTravelDistanceFt.toFixed(1)} ft limit.`
          : blueprint.isNfpa13Sprinklered
            ? `Insert secondary rated exterior exit door or fire-isolated exit passageway to reduce travel path by ${(blueprint.maxExitTravelDistanceFt - limits.maxExitTravelDistanceFt).toFixed(1)} ft.`
            : `Upgrade building envelope to full NFPA 13 automatic sprinkler protection (raising travel limit to ${getNfpa101StatutoryLimits(blueprint.occupancyGroup, true).maxExitTravelDistanceFt.toFixed(0)} ft) or add intermediate fire exit stair.`,
    },
    {
      checkId: 'NFPA101-7.5-COMMON-PATH',
      codeCitation: 'NFPA 101 §7.5.1.1.1 / IBC Table 1006.2.1 Common Path of Egress Travel',
      title: 'Maximum Common Path of Egress Travel Before Two Distinct Exits Diverge',
      measuredValue: blueprint.maxCommonPathOfTravelFt,
      statutoryLimit: limits.maxCommonPathOfTravelFt,
      unit: 'ft',
      passed: blueprint.maxCommonPathOfTravelFt <= limits.maxCommonPathOfTravelFt,
      remediationDirective:
        blueprint.maxCommonPathOfTravelFt <= limits.maxCommonPathOfTravelFt
          ? `Common path of travel (${blueprint.maxCommonPathOfTravelFt.toFixed(1)} ft) satisfies <= ${limits.maxCommonPathOfTravelFt.toFixed(1)} ft limit.`
          : `Add secondary egress door at opposite end of zone to split single-direction travel by -${(blueprint.maxCommonPathOfTravelFt - limits.maxCommonPathOfTravelFt).toFixed(1)} ft.`,
    },
    {
      checkId: 'NFPA101-7.5-DEAD-END',
      codeCitation: 'NFPA 101 §7.5.1.5 / IBC §1020.5 Dead-End Corridor Limit',
      title: 'Maximum Dead-End Corridor Pocket Length',
      measuredValue: blueprint.maxDeadEndCorridorFt,
      statutoryLimit: limits.maxDeadEndCorridorFt,
      unit: 'ft',
      passed: blueprint.maxDeadEndCorridorFt <= limits.maxDeadEndCorridorFt,
      remediationDirective:
        blueprint.maxDeadEndCorridorFt <= limits.maxDeadEndCorridorFt
          ? `Dead-end corridor length (${blueprint.maxDeadEndCorridorFt.toFixed(1)} ft) is within <= ${limits.maxDeadEndCorridorFt.toFixed(1)} ft limit.`
          : `Extend corridor loop to connect with secondary exit stair or enable NFPA 13 sprinkler coverage (50 ft limit).`,
    },
    {
      checkId: 'IBC-1005.3.2-CAPACITY',
      codeCitation: 'IBC §1005.3.2 Egress Door Capacity (0.2" per Occupant)',
      title: 'Aggregate Exterior Exit Door Occupant Discharge Capacity',
      measuredValue: totalExitCapacityOccupants,
      statutoryLimit: blueprint.totalOccupantLoad,
      unit: 'occupants',
      passed: totalExitCapacityOccupants >= blueprint.totalOccupantLoad,
      remediationDirective:
        totalExitCapacityOccupants >= blueprint.totalOccupantLoad
          ? `Aggregate exit capacity (${totalExitCapacityOccupants} occupants) exceeds design load (${blueprint.totalOccupantLoad} occupants).`
          : `Widen exterior panic exit doors to provide >= ${(blueprint.totalOccupantLoad * 0.2).toFixed(1)}" total clear leaf width.`,
    },
  ];

  const blockingViolations = checks.filter((c) => !c.passed);
  const passedCount = checks.length - blockingViolations.length;
  const egressSafetyScorePct = Math.round((passedCount / checks.length) * 100);

  return {
    blueprintId: blueprint.blueprintId,
    isNfpa13Sprinklered: blueprint.isNfpa13Sprinklered,
    verdict:
      blockingViolations.length === 0 ? 'NFPA101_LIFE_SAFETY_COMPLIANT' : 'NFPA101_EGRESS_VIOLATION_HOLD',
    egressSafetyScorePct,
    statutoryLimits: limits,
    totalExitCapacityOccupants,
    requiredOccupantLoad: blueprint.totalOccupantLoad,
    zonePaths,
    checks,
    blockingViolations,
  };
}
