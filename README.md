# BlueprintSight VL — Nemotron Vision-Language Architectural Floorplan, 2010 ADA & NFPA 101 Fire-Code Inspector

**Built for the Nebius x NVIDIA Global AI Hackathon (`$50,000`)**  
**Local Workstation Port:** `http://127.0.0.1:5185` (`strictPort: true`)

---

## Overview

**BlueprintSight VL** combines **NVIDIA NeMo Retriever VLM (`NVLM-1.0-72B`)** and **Llama-3.1-Nemotron-70B-Instruct** on **Nebius AI Studio** with a deterministic geometric and rectilinear pathfinding engine to audit commercial and institutional architectural floorplans against:
1. **2010 ADA Standards for Accessible Design**:
   - **§304.3.1 Circular Turning Space**: Minimum `60.0"` (`1525 mm`) 360° wheelchair turning circle free of door swing overlap.
   - **§404.2.3 Clear Width of Doorways**: Minimum `32.0"` (`815 mm`) clear opening measured with the door open `90°`.
   - **§403.5.1 & IBC §1020.2 Corridor Width**: Minimum `36.0"` accessible route (`>= 44.0"` required for occupant loads `>= 50`).
   - **§404.2.4 Pull-Side Maneuvering Clearance**: Minimum `18.0"` latch-side pull clearance at hinged doors.
2. **NFPA 101 Life Safety Code & IBC Table 1017.2**:
   - **§7.6 Travel Distance to Exits**: Rectilinear Manhattan travel distance from the most remote occupied point to the nearest exterior panic exit (`150–200 ft` unsprinklered vs. `250–300 ft` NFPA 13 sprinklered).
   - **§7.5.1.1.1 Common Path of Egress Travel**: Enforces `75 ft`–`100 ft` common path limits before two distinct exit routes diverge.
   - **§7.5.1.5 Dead-End Corridor Pocket Limit** and **IBC §1005.3.2 Exit Door Discharge Capacity (`0.2"` per occupant)**.

---

## Quick Start

```bash
# 1. Run the 6-Gate Deterministic Verification Suite
npm test

# 2. Typecheck & Build Production Bundle
npm run build

# 3. Launch Interactive CAD Blueprint Inspector on Port 5185
npm run dev
```
