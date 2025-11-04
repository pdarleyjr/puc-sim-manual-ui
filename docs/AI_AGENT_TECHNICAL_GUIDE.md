# AI Agent Technical Guide: Fire Ground Hydraulics & Operations

## 1. Core Principles & Definitions

This section provides foundational knowledge for all hydraulic calculations and operational logic.

| Concept | Definition/Standard | Key Data |
| :--- | :--- | :--- |
| **Heavy Hydrant Hookup** | Connecting LDH to multiple hydrant ports to maximize flow potential. Also known as "dressing the hydrant." | Essential for large-scale operations. |
| **20-PSI Rule (NFPA 291)** | NFPA 291 hydrant flow ratings are established while maintaining a **residual pressure in the water MAIN** of 20 psi with all outlets in use. | Minimum residual **MAIN** pressure = 20 psi (measured at hydrant gauge). |
| **Residual Main Pressure** | Pressure in the municipal water main during flow, measured with a gauge at the hydrant. | Must remain ≥ 20 psi per NFPA 291 to prevent main collapse or contamination. **This is the critical constraint.** |
| **Residual Intake Pressure**| Pressure at the eye of the pumper's impeller during flow. Measured by the master intake/compound gauge at the pump panel. | **Will be LOWER than residual main pressure** due to friction loss in supply hoses and apparatus intake plumbing. **CAN legitimately be < 20 psi during high-flow operations** as long as main residual stays ≥ 20 psi. |
| **Cavitation** | Formation of vapor bubbles in a pump when attempting to discharge more water than is being received. | Prevented by maintaining adequate Net Positive Suction Head (NPSH). Warning threshold: intake < 5 psi. Sounds like gravel in the pump and is highly destructive. The 20-psi rule applies to the MAIN, not intake. |

**CRITICAL DISTINCTION:** The NFPA 291 "20 psi residual" requirement refers to pressure in the **water main** (hydrant-side gauge), NOT the engine intake gauge. During high-flow evolutions with long supply lines, engine intake can be 10-15 psi or even approach 0 psi while the hydrant gauge shows 25-30 psi. This is acceptable and expected behavior.

---

## 2. Fire Hydrant Specifications

### 2.1. Hydrant Anatomy & Configuration

- **Standard Dry-Barrel Hydrant (US):**
  - One **steamer port**: 4.5 inches (nominal)
  - Two **side ports**: 2.5 inches each (nominal)
- **Internal Main Valve Sizes:** 4.5 inches or 5.25 inches.
- **ISO Maximum Credit Configuration:**
  - 4.5-inch steamer port
  - Two 2.5-inch side ports
  - **5.25-inch internal main valve**
  - **6-inch branch/lateral** connecting hydrant to main (AWWA recommendation).

### 2.2. Hydrant Flow Mechanics & Area Conversions

The Continuity of Flow equation (Q = A × V) dictates that flow (Q) is a product of area (A) and velocity (V). Increasing the total outlet area by using multiple ports is the primary method for increasing flow from a hydrant.

| Component | Diameter (in) | Internal Area (in²) | Notes |
| :--- | :--- | :--- | :--- |
| **5¼-inch Main Valve**| 5.25 | **21.65** | **The ultimate limiting factor** for internal hydrant flow. |
| 4½-inch Steamer Port | 4.576 | 16.45 | Single largest outlet. |
| 2½-inch Side Port | 2.576 | 5.20 |  |
| **6-inch Branch/Lateral**| 6.0 | **28.27** | Pipe feeding the hydrant; larger than the main valve. |

### 2.3. Hookup Configurations vs. Main Valve Area

| Hookup Configuration | Total Outlet Area (in²) | Comparison to Main Valve (21.65 in²) | Limiting Factor |
| :--- | :--- | :--- | :--- |
| **Single Tap** (Steamer Only) | 16.45 | 76% of main valve area | Hydrant Outlet Configuration |
| **Double Tap** (Steamer + 1 Side Port) | **21.65** | **Equal to main valve area.** | **Hydrant Main Valve.** |
| **Triple Tap** (All Ports) | 26.86 | Exceeds main valve area by 24%. | **Hydrant Main Valve.** |

**Conclusion:** A **Double Tap** is the minimum standard for maximizing hydrant flows. A **Triple Tap** ensures the hydrant's internal valve is the sole bottleneck, not the outlet configuration.

### 2.4. Hydrant Capacity & NFPA 291 Color Codes

Flow ratings are determined at a 20 psi residual main pressure.

| Class | Color | Flow Rate (GPM) |
| :--- | :--- | :--- |
| **AA** | Light Blue | 1,500 GPM or greater |
| **A** | Green | 1,000 - 1,499 GPM |
| **B** | Orange | 500 - 999 GPM |
| **C** | Red | Less than 500 GPM |

- **Hydrant Body:** Recommended to be chrome yellow for public hydrants.
- **Private Hydrants:** Often marked with red-painted bodies.

---

## 3. Supply Lines: Hose & Appliances

### 3.1. Hose Specifications & Friction Loss

- **Large Diameter Hose (LDH):** 4-inch diameter or greater. The modern standard for supply operations due to minimal friction loss.
- **Rule for Maximizing Flow:** The supply line connected to a hydrant outlet **must be larger in diameter than the outlet itself**. Using 2.5" hose on a 2.5" port is inefficient and provides negligible flow increase in a heavy hookup.
- **Friction Loss Formula (Fire Service Standard):**
  
  **FL = C × (Q/100)² × (L/100)**
  
  Where:
  - FL = Friction loss in PSI
  - C = Hose coefficient (see Table 3.2)
  - Q = Flow in GPM
  - L = Hose length in feet
  
  The key principle: friction loss increases with the **square of flow (Q²)** and decreases dramatically with **larger diameter (d⁴·⁸⁷ in Hazen-Williams)**.

- **Appliance Friction Loss:**
  - **Gate valve (fully open):** 2 psi at high flows
  - **2.5" to Storz adapter:** 3 psi
  - **HAV bypass mode:** 4 psi internal loss
  - **Wyes/siamese:** 10 psi at ≥350 GPM
  - **Master stream appliance:** 25 psi regardless of flow

### 3.2. Friction Loss Coefficient Table (Table 3.2)

Standard fire service friction loss coefficients for the formula: **FL = C × (Q/100)² × (L/100)**

| Hose Size | Coefficient (C) | Source | Notes |
| :--- | :--- | :--- | :--- |
| **1.75"** | **15.5** | IFSTA/NFPA | Standard attack line |
| **2.5"** | **2.0** | IFSTA/NFPA | Medium diameter |
| **3"** | **0.8** | IFSTA/NFPA | Uncommon for supply |
| **4"** | **0.2** | IFSTA/NFPA | LDH |
| **5"** | **0.08** | IFSTA/NFPA | **Standard LDH** - dramatically lower FL |

**Critical Observation:** 5" LDH has **10x less friction loss** than 3" hose and **188x less** than 1.75" hose at the same flow. This explains why 3" side lines contribute minimal flow in heavy hookups.

**Example Calculations:**
- 5" × 300 ft @ 1,000 GPM: FL = 0.08 × 10² × 3 = **24 psi**
- 3" × 300 ft @ 1,000 GPM: FL = 0.8 × 10² × 3 = **240 psi** (impractical!)
- 5" × 300 ft @ 2,000 GPM: FL = 0.08 × 20² × 3 = **96 psi**

---

## 4. Operational Procedures & Flow Dynamics

### 4.1. Heavy Hydrant Hookups

- **Principle:** By using multiple LDH lines from a single hydrant, the total flow is divided, dramatically reducing the friction loss in each individual line.

- **Flow Distribution (Physics-Based):** Flow through each leg is determined by **resistance**, not pre-allocated ratios:
  
  **For each leg:** ΔP = C × Q² × (L/100) + appliance_losses
  
  **Solving:** Q = √((ΔP - losses) / (C × L/100))
  
  When double tapping with 5" LDH on both steamer and side port:
  - Steamer naturally carries ~**70%** of total flow due to larger port area (16.45 in² vs 5.20 in²)
  - Side port carries ~**30%** of total flow
  - This distribution emerges from **parallel resistance** physics, not arbitrary allocation

- **Impact:** The 30% flow diversion reduces friction loss in the steamer line by approximately **50%**. This is why intake pressure rises dramatically when adding a second 5" line.

**CRITICAL IMPLEMENTATION - Resistance-Based Solver:**

The simulator uses a physics-based resistance solver, NOT equal-split allocation:

1. **Calculate leg resistance:** R = C × (L/100) + adapter_losses/100
2. **Pressure available:** ΔP = P_hydrant - P_intake
3. **Flow per leg:** Q_i = √(ΔP / R_i) × scaling_factor
4. **Iterate to convergence:** Adjust flows until pressure balance achieved
5. **Apply constraints:**
   - Hydrant main residual ≥ 20 psi (NFPA 291)
   - Hydrant main valve capacity limit (~2000-2700 GPM based on static pressure)
   - Pump governor limit (NFPA 1911 curve: 100% @ 150 psi, 70% @ 200 psi, 50% @ 250 psi)
   - Cavitation guard (intake ≥ 0 psi preferred, warn < 5 psi)
6. **Natural flow distribution:** Steamer dominance emerges from lower resistance

**Why 3" Side Lines Don't Help:**
With C_3in = 0.8 and C_5in = 0.08, a 3" line has **10x more resistance**. Even when parallel to a 5" steamer, the 3" line contributes <15% of total flow while barely reducing friction in the steamer. The intake pressure rise is negligible.

### 4.2. Test Data Highlights (Flowing 2,000 GPM from a single hydrant)

| Configuration | Pumper Flow (GPM) | Residual Intake (psi) | Hydrant Gauge (psi) | Delta (psi) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Single Tap** (1x 5" on steamer) | 2,000 | 25 | 52 | 27 | Baseline. Note: intake < hydrant is normal. |
| **Double Tap** (1x 5", 1x 2.5"/3") | 2,000 | 25 | 52 | 27 | Ineffective. No improvement due to high friction in small line. |
| **Double Tap** (2x 5" lines) | 2,000 | **40** | 52 | 12 | **60% increase in residual intake pressure.** |
| **Triple Tap** (3x 5" lines) | 2,000 | **45** | 52 | 7 | Additional 12.5% increase over double tap. |
| **Extreme Flow Triple Tap**| 2,700 | 15 | 30 | 15 | **Intake < 20 psi is acceptable** as long as hydrant gauge ≥ 20 psi. |

**Key Observations:**
- Using 2.5"/3" hose on side port provides ZERO benefit (friction loss negates any flow increase)
- Using 5" LDH on side port increases intake pressure by 60% at same flow
- Maximum flow limited by 5.25" hydrant main valve (~2500-2700 GPM)
- **Pump rating (1500 GPM from draft) does NOT limit flow when hydrant-supplied**
- Governor (RPM limit) and cavitation (low intake) are the pump-side limits
- Intake can be <20 psi during high flow as long as hydrant main stays ≥20 psi

### 4.3. Hydrant Pressure Boosting Procedure (Using Hydrant Assist Valve)

A specialized operation to increase pressure in a supply line from a weak hydrant or for a long lay.

1.  **Positioning:** Apparatus close to the hydrant.
2.  **Connections:**
    *   5" hose from **unclappered side discharge** of assist valve to **main pump intake**.
    *   5" hose from **clappered side discharge** of assist valve to a **large diameter pump discharge**.
3.  **Initial Charging:** Turn hydrant assist handle to **Boost position**.
4.  **Water Flow:** Bleed air at the intake and open the intake to fill the pump.
5.  **Boosting:** Open the large diameter discharge. Increase throttle until the clapper valve in the assist device opens, boosting pressure in the supply line.
6.  **Safety Check:** Monitor residual pressures. Maintain hydrant gauge ≥ 20 psi (main pressure) and watch for cavitation warnings (intake approaching 0 psi).

---

## 5. Apparatus & Pumping

### 5.1. Fire Apparatus General Specifications (Arrow XT™)

- **Pump:** Centrifugal, Waterous. Can be single-stage or two-stage.
- **Pump Engagements:** Midship pumps are common, engaged via a split-shaft gear case.
- **Pump Panel:** Includes master intake and discharge gauges, pressure governor controls, and valve controls.

### 5.2. Pump Theory & Operations

- **Centrifugal Pump:** A non-positive displacement pump. Imparts velocity to water and converts it to pressure. Cannot pump air and is not self-priming.
- **Priming:** Positive displacement pumps (rotary vane or rotary gear) are used as primers to evacuate air, allowing atmospheric pressure to force water into the centrifugal pump for drafting operations.
- **Pump Rating Context (NFPA 1901):**
  - A "1500 gpm pumper" is rated at **1500 GPM from DRAFT** (20 ft hard sleeve, 10 ft lift, 150 psi net)
  - When **hydrant-supplied** with good pressure (50-80 psi), the pump can **exceed its rated capacity**
  - The hydrant provides the volume; the pump provides pressure boost
  - Limits become: governor (RPM), cavitation (low intake), and impeller physics, NOT the nameplate rating
- **Two-Stage Pumps:**
  - **PRESSURE (Series) Mode:** Water is routed through both impellers sequentially for maximum pressure at lower volumes. Use when PDP > 250 psi is required.
  - **VOLUME (Parallel) Mode:** Water is fed to both impellers simultaneously for maximum volume at lower pressures. Use when pumping ≥ 70% of the pump's rated capacity.
- **Pressure Governor:** An electronic device that regulates engine speed to maintain a set pump discharge pressure, automatically adjusting for changes in flow.
  - **NFPA 1911 Test Points:**
    - 100% rated flow @ 150 psi (20 min test)
    - 70% rated flow @ 200 psi (10 min test)
    - 50% rated flow @ 250 psi (10 min test)
  - Governor prevents over-revving the engine; this limits flow at high PDP regardless of supply
- **Pump Overheating:** A pump that is engaged but not flowing water will overheat. Prevent this by circulating water through a bypass line, the tank-fill line, or a cracked discharge.

### 5.3. Hydraulic Formulas for AI Calculation

- **Nozzle Reaction (Solid Stream):**
  `NR = 1.57 * d² * NP`
  - `NR`: Nozzle Reaction in pounds
  - `d`: Nozzle diameter in inches
  - `NP`: Nozzle Pressure in psi

- **Nozzle Reaction (Fog Stream):**
  `NR = 0.0505 * Q * sqrt(NP)`
  - `NR`: Nozzle Reaction in pounds
  - `Q`: Total flow in GPM
  - `NP`: Nozzle Pressure in psi

- **Flow from Solid Stream Nozzle (GPM) - Freeman Formula:**
  `GPM = 29.7 * d² * sqrt(NP)`
  - Standard form assumes C_d ≈ 0.98 for well-designed nozzles
  - `d`: Orifice diameter in inches
  - `NP`: Nozzle Pressure in psi
  - Alternative: `GPM = 29.83 * C_d * d² * sqrt(NP)` where C_d = 0.90-0.98

- **Pump Discharge Pressure (PDP):**
  `PDP = NP + TPL`
  - `NP`: Nozzle Pressure required
  - `TPL`: Total Pressure Loss (Friction Loss + Appliance Loss + Elevation Loss)

- **Elevation Pressure (EP):**
  `EP (psi) = 0.434 * H (feet)` (exact: 0.433)
  OR
  `EP (psi) = 5 * (Number of stories - 1)` (rule of thumb)

- **Friction Loss (FL) per hose:**
  `FL = C * (Q/100)² * (L/100)`
  - `C`: Hose friction loss coefficient (see Table 3.2 above)
  - `Q`: Flow in GPM
  - `L`: Hose length in feet
  - This is the standard fire service formula

- **Discharge Line Required PDP:**
  For each discharge line:
  `Required_PDP = NP + FL_line + appliance_losses`
  
  Where:
  - NP = Nozzle pressure (smooth bore: 50 psi handline, 80 psi master; fog: 75-100 psi)
  - FL_line = C × (Q/100)² × (L/100) using discharge hose coefficient
  - Appliances = adapters, wyes, standpipe systems, etc.

---

## 6. Citations & References

- NFPA 291: Recommended Practice for Fire Flow Testing and Marking of Hydrants
- NFPA 1901: Standard for Automotive Fire Apparatus  
- NFPA 1911: Standard for Fire Apparatus Pump Testing
- IFSTA Fire Service Hydraulics Manual
- Utah Valley University Fire Science Friction Loss Tables
- Heavy Hydrant Hookups Research (Fire Apparatus Magazine, 2022)
- USFA Water Supply Systems and Evaluation Methods Volume II
- Fire Hydrants and Apparatus Water Supply (textbook)  
## November 2025 Updates  
  
**New Documentation:**  
- CALC_ENGINE_V2_INTEGRATION.md - CalcEngineV2 pure functional engine  
- MOBILE_UI_GUIDE.md - Mobile UX architecture  
  
**Feature Flags:**  
- VITE_CALC_ENGINE_V2 (default OFF)  
- VITE_MOBILE_APP_UI (default OFF)  
  
**Test Coverage:** 139 tests (122 legacy + 17 V2)  
**HAV Tests:** 24 comprehensive tests 
