import { useState, useEffect } from 'react';
import {
  BLUEPRINT_FLOORPLAN_CORPUS,
  getBlueprintCaseById,
  type BlueprintWhatIfOverrides,
} from './lib/blueprint/floorplan-cad-extractor.ts';
import {
  runBlueprintSightSupervisor,
  createArchitectSealAttestation,
  type BlueprintSightSupervisorReport,
  type ArchitectSealAttestation,
} from './lib/nebius/nebius-nemotron-vl-supervisor.ts';
import './styles.css';

export function App() {
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(
    BLUEPRINT_FLOORPLAN_CORPUS[0].blueprintId
  );
  const baseCase = getBlueprintCaseById(selectedBlueprintId);

  const [overrides, setOverrides] = useState<BlueprintWhatIfOverrides>({
    turningCircleDiameterIn: baseCase.minTurningCircleDiameterIn,
    minDoorClearWidthIn: baseCase.minDoorClearWidthIn,
    primaryCorridorWidthIn: baseCase.primaryCorridorWidthIn,
    maxExitTravelDistanceFt: baseCase.maxExitTravelDistanceFt,
    commonPathOfTravelFt: baseCase.maxCommonPathOfTravelFt,
    isNfpa13Sprinklered: baseCase.isNfpa13Sprinklered,
  });

  const [report, setReport] = useState<BlueprintSightSupervisorReport | null>(null);
  const [architectName, setArchitectName] = useState<string>('Elena Vance, AIA, PE');
  const [licenseNumber, setLicenseNumber] = useState<string>('AIA-304918');
  const [attestation, setAttestation] = useState<ArchitectSealAttestation | null>(null);
  const [attestationError, setAttestationError] = useState<string | null>(null);

  useEffect(() => {
    const nextBase = getBlueprintCaseById(selectedBlueprintId);
    const initialOverrides: BlueprintWhatIfOverrides = {
      turningCircleDiameterIn: nextBase.minTurningCircleDiameterIn,
      minDoorClearWidthIn: nextBase.minDoorClearWidthIn,
      primaryCorridorWidthIn: nextBase.primaryCorridorWidthIn,
      maxExitTravelDistanceFt: nextBase.maxExitTravelDistanceFt,
      commonPathOfTravelFt: nextBase.maxCommonPathOfTravelFt,
      isNfpa13Sprinklered: nextBase.isNfpa13Sprinklered,
    };
    setOverrides(initialOverrides);
    setAttestation(null);
    setAttestationError(null);
  }, [selectedBlueprintId]);

  useEffect(() => {
    let cancelled = false;
    runBlueprintSightSupervisor(baseCase, { overrides }).then((res) => {
      if (!cancelled) {
        setReport(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [baseCase, overrides]);

  const updateOverride = (patch: Partial<BlueprintWhatIfOverrides>) => {
    setOverrides((prev) => ({ ...prev, ...patch }));
    setAttestation(null);
    setAttestationError(null);
  };

  const handleAutoRemediateAll = () => {
    const requiredCorridor = baseCase.totalOccupantLoad >= 50 ? 48.0 : 40.0;
    updateOverride({
      turningCircleDiameterIn: Math.max(64.0, baseCase.minTurningCircleDiameterIn),
      minDoorClearWidthIn: Math.max(36.0, baseCase.minDoorClearWidthIn),
      primaryCorridorWidthIn: Math.max(requiredCorridor, baseCase.primaryCorridorWidthIn),
      maxExitTravelDistanceFt: Math.min(185.0, baseCase.maxExitTravelDistanceFt),
      commonPathOfTravelFt: Math.min(62.0, baseCase.maxCommonPathOfTravelFt),
      isNfpa13Sprinklered: true,
    });
  };

  const handleResetToOriginal = () => {
    updateOverride({
      turningCircleDiameterIn: baseCase.minTurningCircleDiameterIn,
      minDoorClearWidthIn: baseCase.minDoorClearWidthIn,
      primaryCorridorWidthIn: baseCase.primaryCorridorWidthIn,
      maxExitTravelDistanceFt: baseCase.maxExitTravelDistanceFt,
      commonPathOfTravelFt: baseCase.maxCommonPathOfTravelFt,
      isNfpa13Sprinklered: baseCase.isNfpa13Sprinklered,
    });
  };

  const handleSealAttestation = () => {
    if (!report) return;
    try {
      const signed = createArchitectSealAttestation(report, architectName, licenseNumber);
      setAttestation(signed);
      setAttestationError(null);
    } catch (err) {
      setAttestation(null);
      setAttestationError(err instanceof Error ? err.message : 'Invalid license seal');
    }
  };

  if (!report) {
    return <div className="app-shell">Initializing Nemotron Vision-Language CAD Engine...</div>;
  }

  const activeBp = report.blueprint;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-badges">
            <span className="badge badge-nvidia">NVIDIA Nemotron VL + NIM</span>
            <span className="badge badge-nebius">Nebius AI Studio H100</span>
            <span className={`badge ${report.isPermitReady ? 'badge-pass' : 'badge-fail'}`}>
              {report.overallPermitStatus}
            </span>
          </div>
          <h1 className="brand-title">
            BlueprintSight VL — Architectural CAD, 2010 ADA &amp; NFPA 101 Fire-Code Inspector
          </h1>
          <p className="brand-subtitle">
            Spatial Vision-Language Vector Verification · 60&quot; Wheelchair Turning Circles · 32&quot; Door Clearances · Manhattan Egress Pathfinding
          </p>
        </div>

        <div className="kpi-strip">
          <div className="kpi-pill">
            <div className="kpi-label">Plan-Check Score</div>
            <div
              className="kpi-value"
              style={{ color: report.isPermitReady ? '#34d399' : '#f87171' }}
            >
              {report.overallComplianceScorePct}%
            </div>
          </div>
          <div className="kpi-pill">
            <div className="kpi-label">ADA 2010 Status</div>
            <div
              className="kpi-value"
              style={{
                color:
                  report.adaResult.verdict === 'ADA_FULLY_COMPLIANT' ? '#34d399' : '#f87171',
                fontSize: '0.92rem',
              }}
            >
              {report.adaResult.mandatoryPassedCount}/{report.adaResult.mandatoryTotalCount} Passed
            </div>
          </div>
          <div className="kpi-pill">
            <div className="kpi-label">NFPA 101 Egress</div>
            <div
              className="kpi-value"
              style={{
                color:
                  report.nfpaResult.verdict === 'NFPA101_LIFE_SAFETY_COMPLIANT'
                    ? '#34d399'
                    : '#f87171',
                fontSize: '0.92rem',
              }}
            >
              {report.nfpaResult.checks.length - report.nfpaResult.blockingViolations.length}/
              {report.nfpaResult.checks.length} Passed
            </div>
          </div>
          <div className="kpi-pill">
            <div className="kpi-label">PII Title Scrub</div>
            <div className="kpi-value" style={{ color: '#38bdf8', fontSize: '0.92rem' }}>
              {report.scrubbedMetadata.redactionCount} Redacted
            </div>
          </div>
        </div>
      </header>

      <section className="case-selector" aria-label="Architectural Floorplan Presets">
        {BLUEPRINT_FLOORPLAN_CORPUS.map((item) => {
          const isSelected = item.blueprintId === selectedBlueprintId;
          return (
            <button
              key={item.blueprintId}
              type="button"
              className={`case-btn ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedBlueprintId(item.blueprintId)}
            >
              <div className="case-sheet">
                {item.blueprintId} · SHEET {item.sheetNumber}
              </div>
              <div className="case-name">{item.title}</div>
              <div className="case-meta">
                {item.occupancyLabel} · {item.grossAreaSqFt.toLocaleString()} sq ft ·{' '}
                {item.totalOccupantLoad} Occupants
              </div>
            </button>
          );
        })}
      </section>

      <div className="workspace-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                Interactive 2D CAD Blueprint Vector &amp; Egress Canvas ({activeBp.sheetNumber})
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                NVLM-1.0-72B Bounding Boxes + ADA §304.3.1 60&quot; Turning Envelopes + NFPA 101 Manhattan Egress Vectors
              </div>
            </div>
            <span className="badge badge-nebius">
              {activeBp.isNfpa13Sprinklered ? 'NFPA 13 SPRINKLERED' : 'UNSPRINKLERED ENVELOPE'}
            </span>
          </div>

          <div className="blueprint-svg-wrap">
            <svg
              viewBox="0 0 800 340"
              className="blueprint-svg"
              role="img"
              aria-label={`CAD Floorplan for ${activeBp.title}`}
            >
              <defs>
                <pattern id="cad-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path
                    d="M 25 0 L 0 0 0 25"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.09)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect x="0" y="0" width="800" height="340" fill="url(#cad-grid)" />
              <rect
                x="45"
                y="30"
                width="710"
                height="285"
                fill="rgba(15, 23, 42, 0.65)"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {activeBp.zones.map((zone) => {
                const turningPass = zone.turningCircleDiameterIn >= 60.0;
                const doorPass = zone.minDoorClearWidthIn >= 32.0;
                const pathObj = report.nfpaResult.zonePaths.find(
                  (p) => p.zoneId === zone.zoneId
                );
                const egressPass = pathObj ? pathObj.passed : true;
                const zoneAllPass = turningPass && doorPass && egressPass;

                const cx = zone.bbox.x + zone.bbox.width / 2;
                const cy = zone.bbox.y + zone.bbox.height / 2;

                return (
                  <g key={zone.zoneId}>
                    <rect
                      x={zone.bbox.x}
                      y={zone.bbox.y}
                      width={zone.bbox.width}
                      height={zone.bbox.height}
                      fill={
                        zoneAllPass
                          ? 'rgba(16, 185, 129, 0.09)'
                          : 'rgba(239, 68, 68, 0.14)'
                      }
                      stroke={zoneAllPass ? '#10b981' : '#ef4444'}
                      strokeWidth="2"
                    />
                    <text
                      x={zone.bbox.x + 10}
                      y={zone.bbox.y + 20}
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {zone.label}
                    </text>
                    <text
                      x={zone.bbox.x + 10}
                      y={zone.bbox.y + 36}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      Occ: {zone.occupantLoad} | Door: {zone.minDoorClearWidthIn.toFixed(1)}&quot; | Travel:{' '}
                      {zone.remotePointToExitFt.toFixed(0)}ft
                    </text>

                    {/* 60-Inch Wheelchair Turning Circle Indicator */}
                    <circle
                      cx={cx}
                      cy={cy + 14}
                      r={Math.min(28, Math.max(16, zone.turningCircleDiameterIn * 0.36))}
                      fill={
                        turningPass
                          ? 'rgba(16, 185, 129, 0.16)'
                          : 'rgba(239, 68, 68, 0.25)'
                      }
                      stroke={turningPass ? '#34d399' : '#f87171'}
                      strokeDasharray="4 2"
                      strokeWidth="1.8"
                    />
                    <text
                      x={cx}
                      y={cy + 18}
                      textAnchor="middle"
                      fill={turningPass ? '#6ee7b7' : '#fca5a5'}
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      Ø{zone.turningCircleDiameterIn.toFixed(1)}&quot;
                    </text>
                  </g>
                );
              })}

              {/* Manhattan Egress Travel Vectors */}
              {report.nfpaResult.zonePaths.map((zp) => {
                const pts = zp.manhattanWaypoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
                return (
                  <polyline
                    key={`path-${zp.zoneId}`}
                    points={pts}
                    fill="none"
                    stroke={zp.passed ? '#38bdf8' : '#f59e0b'}
                    strokeWidth="2.2"
                    strokeDasharray="6 4"
                  />
                );
              })}

              {/* Certified Fire Exit Doors */}
              {activeBp.exits.map((ex) => (
                <g key={ex.exitId}>
                  <rect
                    x={ex.x - 16}
                    y={ex.y - 14}
                    width="32"
                    height="28"
                    rx="4"
                    fill="#065f46"
                    stroke="#34d399"
                    strokeWidth="2"
                  />
                  <text
                    x={ex.x}
                    y={ex.y + 4}
                    textAnchor="middle"
                    fill="#ecfdf5"
                    fontSize="9"
                    fontWeight="800"
                  >
                    EXIT
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="legend-bar">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#10b981' }} /> Compliant Zone &amp;
              Ø60&quot;+ Turning Space
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#ef4444' }} /> ADA / Life-Safety Hold
              (&lt;60&quot; Turn or &lt;32&quot; Door)
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#38bdf8' }} /> NFPA 101 Manhattan
              Egress Vector
            </span>
          </div>

          <div className="slider-grid">
            <div className="slider-card">
              <div className="slider-header">
                <span>ADA §304.3 Turning Circle Ø</span>
                <span
                  style={{
                    color: activeBp.minTurningCircleDiameterIn >= 60 ? '#34d399' : '#f87171',
                  }}
                >
                  {activeBp.minTurningCircleDiameterIn.toFixed(1)}&quot; (Min 60.0&quot;)
                </span>
              </div>
              <input
                type="range"
                className="slider-input"
                min={48}
                max={76}
                step={0.5}
                value={activeBp.minTurningCircleDiameterIn}
                onChange={(e) =>
                  updateOverride({ turningCircleDiameterIn: parseFloat(e.target.value) })
                }
              />
              <div className="slider-sub">Wheelchair 360° clear turning space diameter</div>
            </div>

            <div className="slider-card">
              <div className="slider-header">
                <span>ADA §404.2.3 Door Clear Width</span>
                <span
                  style={{
                    color: activeBp.minDoorClearWidthIn >= 32 ? '#34d399' : '#f87171',
                  }}
                >
                  {activeBp.minDoorClearWidthIn.toFixed(1)}&quot; (Min 32.0&quot;)
                </span>
              </div>
              <input
                type="range"
                className="slider-input"
                min={28}
                max={44}
                step={0.5}
                value={activeBp.minDoorClearWidthIn}
                onChange={(e) =>
                  updateOverride({ minDoorClearWidthIn: parseFloat(e.target.value) })
                }
              />
              <div className="slider-sub">Clear opening between door face at 90° and stop</div>
            </div>

            <div className="slider-card">
              <div className="slider-header">
                <span>IBC §1020.2 Corridor Width</span>
                <span
                  style={{
                    color:
                      activeBp.primaryCorridorWidthIn >=
                      (activeBp.totalOccupantLoad >= 50 ? 44 : 36)
                        ? '#34d399'
                        : '#f87171',
                  }}
                >
                  {activeBp.primaryCorridorWidthIn.toFixed(1)}&quot; (Min{' '}
                  {activeBp.totalOccupantLoad >= 50 ? '44.0"' : '36.0"'})
                </span>
              </div>
              <input
                type="range"
                className="slider-input"
                min={32}
                max={64}
                step={1}
                value={activeBp.primaryCorridorWidthIn}
                onChange={(e) =>
                  updateOverride({ primaryCorridorWidthIn: parseFloat(e.target.value) })
                }
              />
              <div className="slider-sub">Clear egress spine width free of column/alcove pinch</div>
            </div>

            <div className="slider-card">
              <div className="slider-header">
                <span>NFPA 101 §7.6 Max Exit Travel</span>
                <span
                  style={{
                    color:
                      activeBp.maxExitTravelDistanceFt <=
                      report.nfpaResult.statutoryLimits.maxExitTravelDistanceFt
                        ? '#34d399'
                        : '#f87171',
                  }}
                >
                  {activeBp.maxExitTravelDistanceFt.toFixed(0)} ft (Max{' '}
                  {report.nfpaResult.statutoryLimits.maxExitTravelDistanceFt.toFixed(0)} ft)
                </span>
              </div>
              <input
                type="range"
                className="slider-input"
                min={110}
                max={310}
                step={2}
                value={activeBp.maxExitTravelDistanceFt}
                onChange={(e) =>
                  updateOverride({ maxExitTravelDistanceFt: parseFloat(e.target.value) })
                }
              />
              <div className="slider-sub">Manhattan travel distance from most remote point</div>
            </div>
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-nvidia" onClick={handleAutoRemediateAll}>
              ⚡ Auto-Remediate All ADA &amp; NFPA 101 Geometry Violations
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                updateOverride({ isNfpa13Sprinklered: !activeBp.isNfpa13Sprinklered })
              }
            >
              Toggle NFPA 13 Sprinklers ({activeBp.isNfpa13Sprinklered ? 'ON' : 'OFF'})
            </button>
            <button type="button" className="btn" onClick={handleResetToOriginal}>
              Reset to As-Drawn CAD Baseline
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              Statutory 2010 ADA &amp; NFPA 101 Life-Safety Rule Audits
            </h2>
            <span className={`badge ${report.isPermitReady ? 'badge-pass' : 'badge-fail'}`}>
              {report.totalViolationsCount} Blocking Violations
            </span>
          </div>

          <div className="rule-list">
            {report.adaResult.checks.map((chk) => (
              <div
                key={chk.ruleId}
                className={`rule-card ${chk.passed ? '' : 'violation'}`}
              >
                <div className="rule-top">
                  <span className="rule-code">{chk.codeCitation}</span>
                  <span className={`badge ${chk.passed ? 'badge-pass' : 'badge-fail'}`}>
                    {chk.passed ? 'PASS' : 'ADA HOLD'}
                  </span>
                </div>
                <div className="rule-title">{chk.title}</div>
                <div className="rule-metrics">
                  Measured: {chk.measuredValueIn.toFixed(1)}&quot; · Statutory Min:{' '}
                  {chk.requiredMinIn.toFixed(1)}&quot; ({chk.deltaIn >= 0 ? '+' : ''}
                  {chk.deltaIn.toFixed(1)}&quot;)
                </div>
                <div className="rule-remedy">{chk.cadRemediationAction}</div>
              </div>
            ))}

            {report.nfpaResult.checks.map((chk) => (
              <div
                key={chk.checkId}
                className={`rule-card ${chk.passed ? '' : 'violation'}`}
              >
                <div className="rule-top">
                  <span className="rule-code">{chk.codeCitation}</span>
                  <span className={`badge ${chk.passed ? 'badge-pass' : 'badge-fail'}`}>
                    {chk.passed ? 'PASS' : 'NFPA 101 HOLD'}
                  </span>
                </div>
                <div className="rule-title">{chk.title}</div>
                <div className="rule-metrics">
                  Measured: {chk.measuredValue} {chk.unit} · Statutory Limit: {chk.statutoryLimit}{' '}
                  {chk.unit}
                </div>
                <div className="rule-remedy">{chk.remediationDirective}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              Nebius AI Studio x NVIDIA NIM 4-Stage Vision-Language Trace
            </h2>
            <span className="badge badge-nvidia">{report.executionMode}</span>
          </div>

          <div className="rule-list">
            {report.agentTraces.map((tr) => (
              <div key={tr.stageOrder} className="rule-card">
                <div className="rule-top">
                  <span className="rule-code">
                    {tr.agentName} ({tr.latencyMs}ms)
                  </span>
                  <span className="badge badge-nebius">{tr.modelId}</span>
                </div>
                <div className="rule-remedy">{tr.summaryOutput}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
              Zero-Leak Scrubbed Title Block Sent to Nebius VLM Endpoint:
            </div>
            <div className="code-box">{report.scrubbedMetadata.scrubbedText}</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              AutoCAD / Revit DXF Redline Script &amp; Licensed AIA/PE Stamp Lock
            </h2>
            <span className="badge badge-nebius">
              {report.cadRedlineCommands.length} DXF Macros
            </span>
          </div>

          {report.cadRedlineCommands.length === 0 ? (
            <div className="code-box" style={{ color: '#6ee7b7' }}>
              // All 2010 ADA &amp; NFPA 101 geometric checks passed. Ready for Licensed Architect AIA/PE Municipal Seal.
            </div>
          ) : (
            report.cadRedlineCommands.map((cmd) => (
              <div key={cmd.commandId} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5' }}>
                  [{cmd.dxfLayer}] {cmd.codeReference} — Zone {cmd.targetZoneId}
                </div>
                <div className="code-box">{cmd.dxfMacroSnippet}</div>
              </div>
            ))
          )}

          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(148, 163, 184, 0.16)',
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
              Licensed Architect (AIA) / Fire Protection Engineer (PE) Stamp Attestation
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
              Binds a tamper-evident FNV-1a cryptographic hash of the current blueprint geometry prior to Municipal Plan-Check export.
            </div>

            <div className="input-row">
              <input
                type="text"
                className="text-input"
                value={architectName}
                onChange={(e) => setArchitectName(e.target.value)}
                placeholder="Architect / PE Full Name"
                aria-label="Architect or Engineer Full Name"
              />
              <input
                type="text"
                className="text-input"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="AIA-304918 or PE-CA-88412"
                aria-label="AIA or PE License Number"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSealAttestation}
              >
                Apply AIA/PE Seal
              </button>
            </div>

            {attestationError && (
              <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '8px' }}>
                {attestationError}
              </div>
            )}

            {attestation && (
              <div className="code-box" style={{ marginTop: '10px', color: '#a7f3d0' }}>
                SEALED BY: {attestation.architectName} ({attestation.licenseIdentifier} ·{' '}
                {attestation.licenseType}) | SHEET: {attestation.sheetNumber} | STATUS:{' '}
                {attestation.overallPermitStatus} | HASH: {attestation.contentHashFnv1a}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
