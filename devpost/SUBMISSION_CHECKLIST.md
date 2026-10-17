# Nebius x NVIDIA Global AI Hackathon Submission Checklist

- [x] **Gate 1 (`floorplan-cad-extractor.ts`)**: 4 commercial & institutional floorplans, zero-leak title-block PII/vault scrubber, and live What-If geometry override engine verified.
- [x] **Gate 2 (`ada-accessibility-engine.ts`)**: 2010 ADA §304.3.1 (`60"` turning circle), §404.2.3 (`32"` door clear width), §403.5.1 / IBC §1020.2 (`36"`/`44"` corridor width), and §404.2.4 (`18"` pull latch clearance) verified.
- [x] **Gate 3 (`nfpa101-egress-pathfinder.ts`)**: NFPA 101 §7.6 sprinklered vs. unsprinklered Manhattan exit travel distance, Common Path of Travel, Dead-End Corridor, and IBC §1005.3.2 exit capacity verified.
- [x] **Gate 4 (`nebius-nemotron-vl-supervisor.ts`)**: 4-stage Nebius AI Studio + NVIDIA NIM (`NVLM-1.0-72B` + `Llama-3.1-Nemotron-70B-Instruct`) pipeline, `4.5s` `AbortController` circuit breaker fallback, AutoCAD DXF redline generator, and AIA/PE license attestation lock verified.
- [x] **Gate 5 (`vite.config.ts`)**: Isolated workstation port `127.0.0.1:5185` (`strictPort: true`) verified.
- [x] **Gate 6 (`Clean-Room Audit`)**: Zero internal trade-secret or unrelated project terminology across all 16 audited repository files.
