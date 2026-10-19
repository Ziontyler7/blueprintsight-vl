# Product Requirements Document (PRD) — BlueprintSight VL

## 1. Problem Statement
Commercial architects, civil engineers, and municipal building department plan-checkers spend weeks manually measuring CAD sheets for **2010 ADA Standards** (`60"` wheelchair turning circles, `32"` clear door openings, `44"` high-occupancy corridors) and **NFPA 101 Life Safety Code** exit access travel distances. A single missed `30.5"` doorframe or `56"` restroom turning radius discovered during construction costs `$25,000–$120,000+` in structural demolition and permit delays.

## 2. Solution: BlueprintSight VL on Nebius AI Studio & NVIDIA NIM
**BlueprintSight VL** pairs **NVIDIA NVLM-1.0-72B / NeMo Retriever VLM** and **Llama-3.1-Nemotron-70B-Instruct** on **Nebius AI Studio** with a deterministic geometric and Manhattan pathfinding engine:
- **Zero-Leak Title Block PII Scrubber**: Redacts client owner names, street parcel addresses, phone/email contacts, and sensitive vault/IDF room labels prior to cloud VLM serialization.
- **Interactive 2D SVG CAD Vector Canvas & Live What-If Sliders**: Allows architects to drag turning circle, door opening, corridor width, and exit travel sliders or toggle **NFPA 13 Automatic Sprinkler Systems** in real time.
- **AutoCAD / Revit DXF Redline Patch Synthesizer**: Emits layer-specific (`A-DOOR-ADA`, `A-WALL-PRTN`, `E-LITE-EXIT`, `F-PROT-SPKL`) DXF command macros for every violation.
- **Licensed Architect (`AIA`) / Professional Engineer (`PE`) Stamp Attestation Lock**: Binds a tamper-evident FNV-1a cryptographic hash of the blueprint geometry before unlocking municipal plan-check submittal export.

- **Nebius Token Factory & buildingSMART `IFC4X3_ADD2` Export**: Connects to `https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions` (`nvidia/Llama-3.1-Nemotron-70B-Instruct` with `strict: true` JSON schema) and exports both AutoCAD DXF `.scr` redlines and buildingSMART `IFC.JSON` (`4.3.2.0` / `IFC4X3_ADD2`) BIM property sets.
