# System Architecture — BlueprintSight VL

```mermaid
flowchart TD
    A["Architectural CAD Sheet / Blueprint Preset"] --> B["Gate 1: Title-Block PII & Vault Scrubber"]
    B --> C["Stage 1: NVIDIA NVLM-1.0-72B + NeMo Retriever VLM Vector Parser"]
    C --> D["Gate 2: 2010 ADA Standards & IBC §1020.2 Clearance Engine"]
    C --> E["Gate 3: NFPA 101 §7.6 Manhattan Egress & Capacity Pathfinder"]
    D --> F["Stage 4: Llama-3.1-Nemotron-70B DXF Redline Synthesizer"]
    E --> F
    F --> G["Licensed Architect AIA / PE FNV-1a Stamp Attestation Lock"]
```

## Module Breakdown
1. **`src/lib/blueprint/floorplan-cad-extractor.ts`**: 4 commercial/institutional blueprints (`BP-MED-101`, `BP-STEM-204`, `BP-HOSP-309`, `BP-IND-412`), deterministic PII/security vault scrubber, and pure-memory What-If override engine.
2. **`src/lib/compliance/ada-accessibility-engine.ts`**: Evaluates ADA §304.3.1 (`60"` turning circle), §404.2.3 (`32"` clear door), §403.5.1 / IBC §1020.2 (`36"`/`44"` corridor), and §404.2.4 (`18"` pull latch clearance).
3. **`src/lib/egress/nfpa101-egress-pathfinder.ts`**: Computes Manhattan travel vectors, NFPA 13 sprinklered vs. unsprinklered travel limits, common path of travel, dead-end corridor limits, and IBC §1005.3.2 occupant exit capacity.
4. **`src/lib/nebius/nebius-nemotron-vl-supervisor.ts`**: Orchestrates the 4-stage Nebius AI Studio / NVIDIA NIM pipeline with a `4.5s` `AbortController` circuit breaker and AIA/PE stamp attestation hashing.
