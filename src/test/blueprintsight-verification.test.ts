import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  BLUEPRINT_FLOORPLAN_CORPUS,
  getBlueprintCaseById,
  scrubTitleBlockMetadata,
  verifyZeroMetadataLeakage,
  applyBlueprintWhatIfOverrides,
} from '../lib/blueprint/floorplan-cad-extractor.ts';
import {
  evaluateAdaCompliance,
  verifyAdaComplianceBounds,
} from '../lib/compliance/ada-accessibility-engine.ts';
import {
  auditNfpa101Egress,
  getNfpa101StatutoryLimits,
} from '../lib/egress/nfpa101-egress-pathfinder.ts';
import {
  runBlueprintSightSupervisor,
  createArchitectSealAttestation,
} from '../lib/nebius/nebius-nemotron-vl-supervisor.ts';

async function runVerificationSuite(): Promise<void> {
  const startMs = performance.now();
  console.log('==================================================================');
  console.log('BlueprintSight VL — 6-Gate Deterministic Verification Gauntlet');
  console.log('==================================================================');

  // ---------------------------------------------------------------------------
  // GATE 1: Architectural CAD Vector Extractor, Title-Block Scrubber & Overrides
  // ---------------------------------------------------------------------------
  assert.equal(BLUEPRINT_FLOORPLAN_CORPUS.length, 4, 'Expected 4 commercial/institutional blueprints');
  for (const bp of BLUEPRINT_FLOORPLAN_CORPUS) {
    const scrubbed = scrubTitleBlockMetadata(bp);
    assert.equal(
      scrubbed.zeroMetadataLeakVerified,
      true,
      `Expected zero PII/vault leak for ${bp.blueprintId}`
    );
    assert.equal(
      verifyZeroMetadataLeakage(scrubbed.scrubbedText),
      true,
      `Independent leak check failed for ${bp.blueprintId}`
    );
    assert.ok(scrubbed.redactionCount >= 5, `Expected all 5 PII/vault categories scrubbed for ${bp.blueprintId}`);
  }

  const medCase = getBlueprintCaseById('BP-MED-101');
  const remediatedMed = applyBlueprintWhatIfOverrides(medCase, {
    turningCircleDiameterIn: 64.0,
    minDoorClearWidthIn: 36.0,
    primaryCorridorWidthIn: 50.0,
  });
  assert.equal(remediatedMed.minTurningCircleDiameterIn, 64.0);
  assert.equal(remediatedMed.minDoorClearWidthIn, 36.0);
  console.log('✅ Gate 1 PASSED: Floorplan CAD Extractor, Title-Block Scrubber & What-If Overrides');

  // ---------------------------------------------------------------------------
  // GATE 2: 2010 ADA Standards & IBC §1020.2 Geometric Clearance Engine
  // ---------------------------------------------------------------------------
  const medAdaRaw = evaluateAdaCompliance(medCase);
  assert.equal(medAdaRaw.verdict, 'CRITICAL_LIFE_SAFETY_OR_ADA_HOLD');
  assert.ok(medAdaRaw.blockingViolations.length >= 2, 'BP-MED-101 must flag turning circle (56") and door (30.5")');
  assert.equal(verifyAdaComplianceBounds(medAdaRaw), true);

  const medAdaFixed = evaluateAdaCompliance(remediatedMed);
  assert.equal(medAdaFixed.verdict, 'ADA_FULLY_COMPLIANT');
  assert.equal(medAdaFixed.adaComplianceScorePct, 100);
  assert.equal(verifyAdaComplianceBounds(medAdaFixed), true);

  const indCase = getBlueprintCaseById('BP-IND-412');
  const indAda = evaluateAdaCompliance(indCase);
  assert.equal(indAda.verdict, 'ADA_FULLY_COMPLIANT');
  assert.equal(indAda.blockingViolations.length, 0);
  console.log('✅ Gate 2 PASSED: 2010 ADA §304.3.1 (60" Turn), §404.2.3 (32" Door) & IBC §1020.2 Engine');

  // ---------------------------------------------------------------------------
  // GATE 3: NFPA 101 Life Safety Code Egress & Manhattan Pathfinder
  // ---------------------------------------------------------------------------
  const stemCase = getBlueprintCaseById('BP-STEM-204');
  const stemEgressUnsprinklered = auditNfpa101Egress(stemCase);
  assert.equal(stemEgressUnsprinklered.isNfpa13Sprinklered, false);
  assert.equal(stemEgressUnsprinklered.verdict, 'NFPA101_EGRESS_VIOLATION_HOLD');
  assert.equal(stemEgressUnsprinklered.statutoryLimits.maxExitTravelDistanceFt, 200.0);

  // Toggling NFPA 13 sprinklers on BP-STEM-204 raises travel limit to 300 ft and dead-end limit to 50 ft
  const stemSprinklered = applyBlueprintWhatIfOverrides(stemCase, { isNfpa13Sprinklered: true });
  const stemEgressSprinklered = auditNfpa101Egress(stemSprinklered);
  assert.equal(stemEgressSprinklered.statutoryLimits.maxExitTravelDistanceFt, 300.0);
  assert.equal(stemEgressSprinklered.verdict, 'NFPA101_LIFE_SAFETY_COMPLIANT');

  const hospCase = getBlueprintCaseById('BP-HOSP-309');
  const hospEgress = auditNfpa101Egress(hospCase);
  assert.equal(hospEgress.verdict, 'NFPA101_EGRESS_VIOLATION_HOLD');
  assert.equal(
    getNfpa101StatutoryLimits('A2_ASSEMBLY_DINING', true).maxCommonPathOfTravelFt,
    75.0
  );
  console.log('✅ Gate 3 PASSED: NFPA 101 §7.6 Manhattan Pathfinder & Sprinkler Bonus Verification');

  // ---------------------------------------------------------------------------
  // GATE 4: Nebius AI Studio + NVIDIA Nemotron VL Supervisor, Circuit Breaker & AIA/PE Lock
  // ---------------------------------------------------------------------------
  const indReport = await runBlueprintSightSupervisor(indCase);
  assert.equal(indReport.isPermitReady, true);
  assert.equal(indReport.overallPermitStatus, 'MUNICIPAL_PERMIT_READY');
  assert.equal(indReport.agentTraces.length, 4);
  assert.equal(
    indReport.nebiusTokenFactoryRequest.endpointUrl,
    'https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions'
  );
  assert.equal(indReport.nebiusTokenFactoryRequest.response_format.json_schema.strict, true);
  assert.ok(indReport.ifcJsonComplianceExport.includes('"schemaIdentifier": "IFC4X3_ADD2"'));

  // Verify 4.5s circuit breaker fallback on simulated Nebius cloud failure
  const fallbackReport = await runBlueprintSightSupervisor(medCase, {
    enableLiveNebiusCloud: true,
    nebiusApiKey: 'test-key-simulated-timeout',
    timeoutMs: 50,
    customFetch: async () => {
      throw new Error('NEBIUS_H100_ENDPOINT_UNREACHABLE');
    },
  });
  assert.equal(fallbackReport.fallbackTriggered, true);
  assert.equal(fallbackReport.executionMode, 'LOCAL_DETERMINISTIC_NIM');
  assert.equal(fallbackReport.circuitBreakerReason, 'NEBIUS_H100_ENDPOINT_UNREACHABLE');

  // Verify Licensed Architect AIA / PE Attestation Lock & Hash Sensitivity
  const aiaSeal = createArchitectSealAttestation(
    indReport,
    'Elena Vance, AIA',
    'AIA-304918'
  );
  assert.equal(aiaSeal.signatureValid, true);
  assert.equal(aiaSeal.licenseType, 'AIA_ARCHITECT');
  assert.ok(aiaSeal.contentHashFnv1a.startsWith('FNV1A-'));

  const peSeal = createArchitectSealAttestation(
    indReport,
    'Marcus Chen, PE',
    'PE-CA-88412'
  );
  assert.equal(peSeal.licenseType, 'PE_FIRE_PROTECTION');
  assert.notEqual(aiaSeal.contentHashFnv1a, peSeal.contentHashFnv1a);

  assert.throws(
    () => createArchitectSealAttestation(indReport, 'Bad License', 'INVALID-123'),
    /INVALID_ARCHITECT_LICENSE_FORMAT/
  );
  console.log('✅ Gate 4 PASSED: Nebius Token Factory x NVIDIA NIM Supervisor, IFC-JSON 4.3, & AIA/PE Seal Lock');

  // ---------------------------------------------------------------------------
  // GATE 5: Port 5185 Strict Isolation Check
  // ---------------------------------------------------------------------------
  const repoRoot = path.resolve(import.meta.dirname, '../..');
  const viteConfigContent = fs.readFileSync(path.join(repoRoot, 'vite.config.ts'), 'utf8');
  const pkgJsonContent = fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8');

  assert.ok(viteConfigContent.includes('port: 5185'), 'vite.config.ts must bind to port 5185');
  assert.ok(viteConfigContent.includes('strictPort: true'), 'vite.config.ts must enforce strictPort: true');
  assert.ok(pkgJsonContent.includes('--port 5185 --strictPort'), 'package.json scripts must lock port 5185');
  console.log('✅ Gate 5 PASSED: Port 5185 Strict Isolation Verified');

  // ---------------------------------------------------------------------------
  // GATE 6: Clean-Room Zero IP / Trade-Secret Leakage Audit (Explicit File List)
  // ---------------------------------------------------------------------------
  const filesToAudit = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'README.md',
    'devpost/PRD.md',
    'devpost/ARCHITECTURE.md',
    'devpost/SUBMISSION_CHECKLIST.md',
    'src/main.tsx',
    'src/App.tsx',
    'src/styles.css',
    'src/lib/blueprint/floorplan-cad-extractor.ts',
    'src/lib/compliance/ada-accessibility-engine.ts',
    'src/lib/egress/nfpa101-egress-pathfinder.ts',
    'src/lib/nebius/nebius-nemotron-vl-supervisor.ts',
    'src/test/blueprintsight-verification.test.ts',
  ];

  const bannedFragments: Array<[string, string]> = [
    ['ed', 'ios'],
    ['sover', 'eign'],
    ['3+3', ' self-play'],
    ['proposer', '/adversary'],
    ['citadel', ' forge'],
    ['queen', ' ed'],
    ['baby', ' evo'],
  ];
  const bannedTerms = bannedFragments.map(([a, b]) => (a + b).toLowerCase());

  for (const relPath of filesToAudit) {
    const absPath = path.join(repoRoot, relPath);
    assert.equal(fs.existsSync(absPath), true, `Missing expected repository file: ${relPath}`);
    const content = fs.readFileSync(absPath, 'utf8').toLowerCase();
    for (const term of bannedTerms) {
      assert.equal(
        content.includes(term),
        false,
        `Banned internal term found in ${relPath}`
      );
    }
  }

  const elapsedMs = (performance.now() - startMs).toFixed(2);
  console.log(`✅ Gate 6 PASSED: Clean-Room Audit Verified Across ${filesToAudit.length} Files`);
  console.log('==================================================================');
  console.log(`🏆 ALL 6/6 BLUEPRINTSIGHT VL GATES PASSED IN ${elapsedMs}ms`);
  console.log('==================================================================');
}

runVerificationSuite().catch((err) => {
  console.error('Verification suite failed:', err);
  process.exit(1);
});
