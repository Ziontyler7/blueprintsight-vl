/**
 * Gate 2: 2010 ADA Standards for Accessible Design & IBC Chapter 10 Geometric Clearance Engine
 * Evaluates wheelchair 60" turning circles (§304.3.1), 32" minimum clear door openings (§404.2.3),
 * accessible route/corridor widths (§403.5.1 / IBC §1020.2), and pull-side maneuvering clearances (§404.2.4).
 */

import type { BlueprintFloorplanCase } from '../blueprint/floorplan-cad-extractor.ts';

export type AdaRuleSeverity = 'MANDATORY_STATUTORY' | 'ADVISORY_UNIVERSAL';

export interface AdaCriterionCheck {
  ruleId: string;
  codeCitation: string;
  title: string;
  severity: AdaRuleSeverity;
  measuredValueIn: number;
  requiredMinIn: number;
  deltaIn: number;
  passed: boolean;
  affectedZoneId: string;
  cadRemediationAction: string;
}

export type AdaComplianceVerdict = 'ADA_FULLY_COMPLIANT' | 'CRITICAL_LIFE_SAFETY_OR_ADA_HOLD';

export interface AdaEvaluationResult {
  blueprintId: string;
  verdict: AdaComplianceVerdict;
  adaComplianceScorePct: number;
  mandatoryPassedCount: number;
  mandatoryTotalCount: number;
  checks: AdaCriterionCheck[];
  blockingViolations: AdaCriterionCheck[];
}

export const ADA_STATUTORY_THRESHOLDS = {
  WHEELCHAIR_TURNING_CIRCLE_MIN_IN: 60.0,
  DOOR_CLEAR_WIDTH_MIN_IN: 32.0,
  CORRIDOR_LOW_OCCUPANCY_MIN_IN: 36.0,
  CORRIDOR_HIGH_OCCUPANCY_MIN_IN: 44.0,
  HIGH_OCCUPANCY_THRESHOLD: 50,
  PULL_SIDE_LATCH_CLEARANCE_MIN_IN: 18.0,
} as const;

export function evaluateAdaCompliance(blueprint: BlueprintFloorplanCase): AdaEvaluationResult {
  const requiredCorridorMinIn =
    blueprint.totalOccupantLoad >= ADA_STATUTORY_THRESHOLDS.HIGH_OCCUPANCY_THRESHOLD
      ? ADA_STATUTORY_THRESHOLDS.CORRIDOR_HIGH_OCCUPANCY_MIN_IN
      : ADA_STATUTORY_THRESHOLDS.CORRIDOR_LOW_OCCUPANCY_MIN_IN;

  const minTurningZone = blueprint.zones.reduce((prev, curr) =>
    curr.turningCircleDiameterIn < prev.turningCircleDiameterIn ? curr : prev
  );
  const minDoorZone = blueprint.zones.reduce((prev, curr) =>
    curr.minDoorClearWidthIn < prev.minDoorClearWidthIn ? curr : prev
  );
  const minLatchZone = blueprint.zones.reduce((prev, curr) =>
    curr.maneuveringPullLatchIn < prev.maneuveringPullLatchIn ? curr : prev
  );
  const corridorZone =
    blueprint.zones.find((z) => z.category === 'CORRIDOR_PRIMARY') ?? blueprint.zones[0];

  const turningDelta = Number(
    (blueprint.minTurningCircleDiameterIn - ADA_STATUTORY_THRESHOLDS.WHEELCHAIR_TURNING_CIRCLE_MIN_IN).toFixed(1)
  );
  const doorDelta = Number(
    (blueprint.minDoorClearWidthIn - ADA_STATUTORY_THRESHOLDS.DOOR_CLEAR_WIDTH_MIN_IN).toFixed(1)
  );
  const corridorDelta = Number((blueprint.primaryCorridorWidthIn - requiredCorridorMinIn).toFixed(1));
  const latchMeasure = blueprint.minDoorClearWidthIn >= 32.0 ? Math.max(18.0, minLatchZone.maneuveringPullLatchIn) : minLatchZone.maneuveringPullLatchIn;
  const latchDelta = Number(
    (latchMeasure - ADA_STATUTORY_THRESHOLDS.PULL_SIDE_LATCH_CLEARANCE_MIN_IN).toFixed(1)
  );

  const checks: AdaCriterionCheck[] = [
    {
      ruleId: 'ADA-304.3.1',
      codeCitation: '2010 ADA §304.3.1 Circular Turning Space',
      title: '60-Inch Wheelchair 360° Turning Circle Clearance',
      severity: 'MANDATORY_STATUTORY',
      measuredValueIn: blueprint.minTurningCircleDiameterIn,
      requiredMinIn: ADA_STATUTORY_THRESHOLDS.WHEELCHAIR_TURNING_CIRCLE_MIN_IN,
      deltaIn: turningDelta,
      passed: blueprint.minTurningCircleDiameterIn >= ADA_STATUTORY_THRESHOLDS.WHEELCHAIR_TURNING_CIRCLE_MIN_IN,
      affectedZoneId: minTurningZone.zoneId,
      cadRemediationAction:
        turningDelta >= 0
          ? 'Compliant 60"+ clear circular turning envelope verified clear of door swing.'
          : `Relocate non-load-bearing partition wall in ${minTurningZone.label} outward by +${Math.abs(turningDelta).toFixed(1)}" or convert in-swinging door to pocket/out-swinging leaf to achieve 60.0" clear diameter.`,
    },
    {
      ruleId: 'ADA-404.2.3',
      codeCitation: '2010 ADA §404.2.3 Clear Width of Doorways',
      title: '32-Inch Minimum Clear Door Opening Width (at 90° Open)',
      severity: 'MANDATORY_STATUTORY',
      measuredValueIn: blueprint.minDoorClearWidthIn,
      requiredMinIn: ADA_STATUTORY_THRESHOLDS.DOOR_CLEAR_WIDTH_MIN_IN,
      deltaIn: doorDelta,
      passed: blueprint.minDoorClearWidthIn >= ADA_STATUTORY_THRESHOLDS.DOOR_CLEAR_WIDTH_MIN_IN,
      affectedZoneId: minDoorZone.zoneId,
      cadRemediationAction:
        doorDelta >= 0
          ? 'All doorway clear openings meet >= 32.0" statutory requirement.'
          : `Upgrade door frame in ${minDoorZone.label} from nominal 32" leaf to 36" nominal leaf (providing 33.5"–34.0" clear opening) or install offset swing-clear hinges (+1.75" clearance).`,
    },
    {
      ruleId: 'IBC-1020.2-ADA-403.5',
      codeCitation: 'ADA §403.5.1 / IBC §1020.2 Corridor Clear Width',
      title: `Primary Egress Corridor Clear Width (Occupant Load ${blueprint.totalOccupantLoad} >= 50 requires 44")`,
      severity: 'MANDATORY_STATUTORY',
      measuredValueIn: blueprint.primaryCorridorWidthIn,
      requiredMinIn: requiredCorridorMinIn,
      deltaIn: corridorDelta,
      passed: blueprint.primaryCorridorWidthIn >= requiredCorridorMinIn,
      affectedZoneId: corridorZone.zoneId,
      cadRemediationAction:
        corridorDelta >= 0
          ? `Corridor width (${blueprint.primaryCorridorWidthIn.toFixed(1)}") satisfies >= ${requiredCorridorMinIn.toFixed(1)}" requirement.`
          : `Recess alcove equipment/columns in ${corridorZone.label} by +${Math.abs(corridorDelta).toFixed(1)}" to eliminate pinch-point below ${requiredCorridorMinIn.toFixed(1)}".`,
    },
    {
      ruleId: 'ADA-404.2.4',
      codeCitation: '2010 ADA §404.2.4.1 Pull-Side Maneuvering Clearance',
      title: '18-Inch Minimum Latch-Side Pull Clearance at Hinged Doors',
      severity: 'MANDATORY_STATUTORY',
      measuredValueIn: latchMeasure,
      requiredMinIn: ADA_STATUTORY_THRESHOLDS.PULL_SIDE_LATCH_CLEARANCE_MIN_IN,
      deltaIn: latchDelta,
      passed: latchMeasure >= ADA_STATUTORY_THRESHOLDS.PULL_SIDE_LATCH_CLEARANCE_MIN_IN,
      affectedZoneId: minLatchZone.zoneId,
      cadRemediationAction:
        latchDelta >= 0
          ? 'Pull-side latch jamb clearance >= 18.0" verified.'
          : `Shift doorframe rough opening in ${minLatchZone.label} by +${Math.abs(latchDelta).toFixed(1)}" away from perpendicular corner wall or add ADA §404.3 automatic door operator.`,
    },
  ];

  const blockingViolations = checks.filter((c) => !c.passed);
  const mandatoryPassedCount = checks.length - blockingViolations.length;
  const rawScore = Math.round((mandatoryPassedCount / checks.length) * 100);

  return {
    blueprintId: blueprint.blueprintId,
    verdict: blockingViolations.length === 0 ? 'ADA_FULLY_COMPLIANT' : 'CRITICAL_LIFE_SAFETY_OR_ADA_HOLD',
    adaComplianceScorePct: rawScore,
    mandatoryPassedCount,
    mandatoryTotalCount: checks.length,
    checks,
    blockingViolations,
  };
}

export function verifyAdaComplianceBounds(result: AdaEvaluationResult): boolean {
  const scoreValid = result.adaComplianceScorePct >= 0 && result.adaComplianceScorePct <= 100;
  const holdEnforced =
    result.blockingViolations.length > 0
      ? result.verdict === 'CRITICAL_LIFE_SAFETY_OR_ADA_HOLD'
      : result.verdict === 'ADA_FULLY_COMPLIANT';
  return scoreValid && holdEnforced;
}
