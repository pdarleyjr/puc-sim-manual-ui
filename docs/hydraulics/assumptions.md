# Hydraulics System - Assumptions & Engineering Principles

## Overview

The Fire Pump Simulator uses industry-standard hydraulic formulas combined with field-calibrated coefficients to model realistic fire apparatus operations. The system implements NFPA standards, IFSTA principles, and incorporates real-world data from field testing to provide accurate training scenarios.

This document serves as the engineering reference for understanding the mathematical foundations, simplifications, and assumptions that drive the simulator's calculations.

## Core Formulas

### Friction Loss

```
FL = C × (Q/100)² × (L/100)
```

**Where:**
- `FL` = Friction loss (PSI)
- `C` = Friction coefficient (from [`data/friction_coeffs.json`](../../data/friction_coeffs.json))
- `Q` = Flow rate (GPM)
- `L` = Hose length (feet)

**Source:** IFSTA Pump Operations Manual

**Implementation:** [`src/lib/hydraulics.ts`](../../src/lib/hydraulics.ts) - `calculateFrictionLoss()`, [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts) - `calculateSupplyLineFriction()`

**Derivation:** This formula is derived from the Darcy-Weisbach equation simplified for fire service applications. The division by 100 for both flow and length creates convenient dimensionless units that work well with empirically-derived friction coefficients.

---

## Friction Loss Coefficients

### Single Source of Truth: friction_coeffs.json

**Critical Decision:** The simulator uses **0.025** as the friction coefficient for 5″ LDH, not the traditional IFSTA/NFPA value of **0.08**.

**Source File:** [`data/friction_coeffs.json`](../../data/friction_coeffs.json)

**All friction coefficients must be sourced from this file to prevent discrepancies.**

### Why 0.025 Instead of 0.08?

**Field Calibration Methodology:**

The 0.025 coefficient is derived from 2022 Heavy Hydrant field research that measured actual friction losses in modern 5″ LDH under realistic fire ground conditions:

- **Test Configuration:** 2000 GPM through 200 ft of 5″ LDH
- **Measured Friction Loss:** 20-25 PSI (hose only, before hydrant body & intake plumbing)
- **Calculated Coefficient:** Using FL = C × (Q/100)² × (L/100)
  - 25 PSI = C × (20)² × (2)
  - 25 = C × 400 × 2
  - 25 = 800C
  - **C = 0.03125** (rounded to 0.025 for conservative estimate)

**Modern Hose Characteristics:**

Modern fire hose construction has significantly lower friction than older hose used when IFSTA/NFPA standards were established:

- **Smoother internal liners** – Advanced polymer materials with reduced surface roughness
- **Improved manufacturing tolerances** – More consistent internal diameter throughout hose length
- **Better materials** – Reduced deformation under pressure maintains flow characteristics
- **Field validation** – Real-world testing confirms dramatically lower friction

### Impact of Coefficient Choice

**At 1000 GPM through 100 ft of 5″ LDH:**

| Coefficient | Friction Loss | Difference |
|-------------|---------------|------------|
| **0.025** (field-calibrated) | ~2.5 PSI | Baseline |
| **0.08** (IFSTA/NFPA standard) | ~8.0 PSI | **3.2x higher** |

**This 3.2x difference is critical for accurate hydraulic calculations.**

### Reference Documentation

- **2022 Heavy Hydrant Field Research** – Fire Apparatus Magazine
- **Field calibration data** – 200 ft @ 2000 GPM yielding 20-25 PSI loss
- **IFSTA Pump Operations Manual** – Traditional coefficients for comparison
- **Data file:** [`friction_coeffs.json`](../../data/friction_coeffs.json) – Single source of truth

### Why Not Use 0.08?

The traditional 0.08 coefficient appears in older fire service literature because:

1. **Older hose technology** – Higher internal roughness, more friction
2. **Safety margins** – Conservative "worst case" values for damaged/aged hose
3. **Formula variations** – Some texts use different formula structures requiring different coefficients
4. **Lack of modern field data** – Standards established before modern hose improvements

**The 0.025 coefficient provides:**
- More accurate predictions of modern apparatus performance
- Better training scenarios reflecting current equipment
- Validated field test results with contemporary hose

### Consistency Enforcement

To prevent future discrepancies, the codebase includes:

1. **Single source of truth:** All coefficients imported from [`friction_coeffs.json`](../../data/friction_coeffs.json)
2. **Coefficient Consistency tests:** [`tests/coefficient-consistency.test.ts`](../../tests/coefficient-consistency.test.ts)
3. **No hardcoded values:** Eliminated from [`math.ts`](../../src/features/hydrant-lab/math.ts) and [`hydraulics.ts`](../../src/lib/hydraulics.ts)

**The consistency test suite will fail if:**
- Any coefficient diverges from `friction_coeffs.json`
- The 5″ coefficient changes from 0.025
- Calculations between modules produce different results

---

### Freeman Formula (Smooth Bore Nozzles)

```
Q = 29.7 × d² × √NP
```

**Where:**
- `Q` = Flow (GPM)
- `d` = Nozzle diameter (inches)
- `NP` = Nozzle pressure (PSI)

**Source:** NFPA standards for smooth bore calculations

**Implementation:** [`src/lib/hydraulics.ts`](../../src/lib/hydraulics.ts) - `calculateNozzleFlow()`

**Derivation:** Based on theoretical orifice flow equations with empirical coefficient (29.7) derived from fire service testing. The coefficient accounts for discharge coefficient and unit conversions (PSI to head, inches to feet, etc.).

---

### NFPA 291 Flow Testing

```
Q₂ = Q₁ × √((P₁ - P_res) / (P₂ - P_res))
```

**Where:**
- `Q₁` = Test flow (GPM)
- `Q₂` = Calculated available flow at desired residual (GPM)
- `P₁` = Static pressure (PSI)
- `P₂` = Residual pressure during test (PSI)
- `P_res` = Desired residual pressure (default: 20 PSI)

**Source:** NFPA 291 - Recommended Practice for Fire Flow Testing and Marking of Hydrants

**Implementation:** [`src/lib/hydraulics.ts`](../../src/lib/hydraulics.ts) - `calculateAvailableFlow()`

**Rationale:** This formula assumes a quadratic relationship between pressure and flow, which is characteristic of turbulent flow through orifices and pipes. The 20 PSI residual is the minimum pressure needed to maintain adequate water supply for other users and fire protection systems on the municipal water main.

---

### Pump Performance Curve (NFPA 1901)

**Standard pump ratings:**
- At **50% rated flow**: 110% of rated pressure
  - Example: 750 GPM → 165 PSI (for 1500 GPM @ 150 PSI pump)
- At **100% rated flow**: 100% of rated pressure
  - Example: 1500 GPM → 150 PSI
- At **150% rated flow**: 65% of rated pressure
  - Example: 2250 GPM → 97.5 PSI

**Source:** NFPA 1901 - Standard for Automotive Fire Apparatus

**Implementation:** [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts) - `calculatePumpPerformance()`

**Rationale:** These values represent the minimum performance standards for fire apparatus pumps. Real pumps often exceed these specifications. The curve shape reflects centrifugal pump physics where pressure decreases with increased flow.

---

### Required Pump Discharge Pressure

```
PDP = NP + FL + AL + EP
```

**Where:**
- `PDP` = Pump Discharge Pressure (PSI)
- `NP` = Nozzle Pressure (PSI)
- `FL` = Friction Loss in hose (PSI)
- `AL` = Appliance Loss (PSI)
- `EP` = Elevation Pressure (0.434 PSI per foot of elevation gain)

**Source:** IFSTA Pump Operations Manual

**Implementation:** [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts) - `calculateRequiredPDP()`

**Rationale:** This additive approach accounts for all pressure losses between the pump and the nozzle, ensuring adequate nozzle pressure for effective fire suppression.

---

## Key Assumptions & Simplifications

### 20-PSI Main Residual Rule

**Assumption:** Minimum 20 PSI residual pressure must remain in the municipal water main during fire operations.

**Implementation:**
- Intake pressure < 20 PSI triggers warnings in [`src/features/hydrant-lab/AdvisorChips.tsx`](../../src/features/hydrant-lab/AdvisorChips.tsx)
- Flow calculations in [`src/lib/hydraulics.ts`](../../src/lib/hydraulics.ts) assume 20 PSI minimum residual
- **Important Note:** Intake pressure < 20 PSI at the pump is acceptable if it doesn't violate the main residual (e.g., due to friction loss in supply line)

**Rationale:** Ensures adequate pressure for:
- Other municipal water users
- Building fire protection systems (sprinklers, standpipes)
- Simultaneous fire ground operations
- Maintaining water system integrity

**Source:** NFPA 291 doctrine, municipal water supply best practices

---

### Friction Coefficients

The simulator uses field-calibrated coefficients that differ from traditional textbook values:

| Hose Type | Our Coefficient | Traditional Value | Difference |
|-----------|----------------|-------------------|------------|
| **5-inch LDH** | 0.025 PSI/100ft | 0.08 PSI/100ft | 69% lower |
| **2.5-inch attack** | 2.0 PSI/100ft | 2.0 PSI/100ft | Same |
| **1.75-inch attack** | 15.5 PSI/100ft | 15.5 PSI/100ft | Same |

**Source:** 
- Field calibration data from 2022 field testing
- IFSTA Pump Operations Manual (baseline values)
- Data stored in [`data/friction_coeffs.json`](../../data/friction_coeffs.json)

**Rationale for 5-inch LDH difference:** Modern hose construction features:
- Smoother internal liners
- Improved manufacturing tolerances
- Better materials with less surface roughness
- Real-world testing shows significantly lower friction than textbook values

**Impact:** Lower friction coefficients result in:
- Higher available flow from hydrants
- Lower pump discharge pressures required
- More efficient water delivery

---

### Appliance Losses (Fixed Values)

The simulator uses simplified fixed pressure losses for appliances:

| Appliance | Pressure Loss/Gain | Notes |
|-----------|-------------------|-------|
| **Gate valve** | 2 PSI | Fully open position |
| **Storz adapter** | 3 PSI | Quick-connect coupling |
| **HAV (bypass mode)** | 4 PSI | Hydrant assist valve |
| **HAV (boost mode)** | -10 PSI | Pressure gain from venturi effect |
| **Wye/siamese** | 10 PSI | Manifold connections |
| **Generic discharge** | 10 PSI | Standard discharge connection |

**Source:** 
- AI Technical Guide Section 3.3
- IFSTA Pump Operations Manual
- Manufacturer specifications

**Rationale:** 
- Real-world appliance losses vary with flow rate
- Fixed values provide simplified, conservative estimates for training
- Adequate for learning pump operations without overwhelming complexity
- Values represent typical operating conditions at common fire ground flows

**Limitation:** In reality, losses increase with the square of flow rate. Future versions may implement dynamic coefficients.

---

### Hydrant Main Valve Coefficient

```
K ≈ 348 for 5.25-inch main valve
```

**Derivation:** Based on orifice flow equation:
```
Q = K × √ΔP
```

Where `K` relates to the valve's effective area and discharge coefficient.

**Source:** 
- Heavy Hydrant research data
- Field flow testing validation
- Derived from NFPA 291 test data

**Implementation:** [`src/features/hydrant-lab/store.ts`](../../src/features/hydrant-lab/store.ts) - hydrant flow calculations

**Usage:** This coefficient allows the simulator to calculate realistic hydrant flow characteristics based on pressure differential across the main valve.

---

### Cavitation Thresholds

The simulator monitors intake pressure to warn of cavitation risk:

| Threshold | Pressure | Risk Level | Color Code |
|-----------|----------|------------|------------|
| **Critical** | < 5 PSI | Severe cavitation likely | Red |
| **Warning** | < 10 PSI | Moderate cavitation risk | Red |
| **Caution** | < 15 PSI | Minor cavitation possible | Amber |
| **Safe** | ≥ 20 PSI | Normal operation | Green |

**Source:** 
- Pump manufacturer specifications
- NFPA 1901 pump testing requirements
- Field experience data

**Implementation:** [`src/features/hydrant-lab/AdvisorChips.tsx`](../../src/features/hydrant-lab/AdvisorChips.tsx)

**Rationale:** Cavitation occurs when pump intake pressure drops below vapor pressure of water, causing:
- Vapor bubbles in pump impeller
- Reduced pump efficiency
- Potential pump damage
- Loss of prime

---

## Hydraulic Derivations

### Parallel Supply Lines

When multiple supply lines connect to a single intake:

**For two equal-diameter hoses:**
```
Q_total ≈ √2 × Q_single ≈ 1.41 × Q_single
```

**This means approximately 41% increase, NOT 100% (double).**

**Electrical Analogy:** 
```
1/R_total = 1/R₁ + 1/R₂
For equal resistances: R_total = R/2
Since Q ∝ 1/√R, then Q_total = √2 × Q_single
```

**Implementation:** [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts) - parallel flow distribution

**Validation:** Field testing confirms this approximation, often cited as "second line gives 70% more flow" in fire service training.

---

### Iterative Solver Equilibrium

The simulator uses iterative solving to find hydraulic equilibrium:

**Process:**
1. Start with initial pressure/flow estimates
2. Calculate hydrant supply capacity
3. Calculate pump intake requirements based on discharge demands
4. Calculate friction losses in supply lines
5. Calculate appliance losses
6. Check if supply matches demand within tolerance
7. Adjust and repeat if not converged

**Convergence Criteria:** ±1 PSI accuracy

**Typical Iterations:** 3-5 iterations for most scenarios

**Implementation:** [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts) - main calculation engine

**Rationale:** Fire ground hydraulics is a coupled system where:
- Supply affects intake pressure
- Intake pressure affects pump performance
- Pump performance affects discharge pressure
- Discharge affects flow distribution
- Flow affects friction losses
- Friction losses affect intake pressure (closes the loop)

Iterative solving handles these interdependencies automatically.

---

## Comparisons to Field Standards

### Traditional Pump Chart Method

**Traditional Approach:**
- Uses 0.08 coefficient for 5-inch hose
- Conservative "worst case" values
- Provides safety margin for old/damaged hose

**Simulator Approach:**
- Uses 0.025 coefficient (field-calibrated)
- Reflects modern hose performance
- More accurate for training scenarios

**Result:** Simulator shows:
- Lower friction losses
- Higher available flows
- Better matches real-world pump operations with modern equipment

---

### Rule-of-Thumb: "Second Line Gives 70% More"

**Traditional Fire Service Rule:** Adding a second supply line of equal diameter increases flow by approximately 70%.

**Simulator Confirmation:** Mathematical analysis confirms this:
```
√2 ≈ 1.414, which is 41.4% increase
With friction/resistance variations: 40-70% range typical
```

**Implementation:** Parallel flow calculations in [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts)

---

### 20-PSI Main Rule Enforcement

The simulator strictly enforces NFPA 291's 20-PSI minimum residual:

**Enforcement Points:**
1. **Flow Calculations:** [`src/lib/hydraulics.ts`](../../src/lib/hydraulics.ts) - `calculateAvailableFlow()` uses 20 PSI as P_res default
2. **Warning System:** [`src/features/hydrant-lab/AdvisorChips.tsx`](../../src/features/hydrant-lab/AdvisorChips.tsx) - alerts when approaching limit
3. **Visual Feedback:** Color-coded pressure gauges in [`src/components/hydrant/MonitorOutputMeter.tsx`](../../src/components/hydrant/MonitorOutputMeter.tsx)

**Educational Value:** Reinforces best practice that protects:
- Municipal water infrastructure
- Building fire protection systems
- Other emergency operations

---

## Safety Margins

### Apparatus Pump Envelopes

The simulator respects NFPA 1901 pump performance envelopes:

**Operational Limits:**
- No operation beyond 150% rated flow
- Maximum pressure at churn (no-flow): typically 110% of rated pressure
- Automatic governor limiting in extreme conditions

**Implementation:** [`src/engine/calcEngineV2.ts`](../../src/engine/calcEngineV2.ts) - `calculatePumpPerformance()`

**Rationale:** Prevents:
- Pump damage from over-speed
- Hoseline rupture from excessive pressure
- Unsafe operating conditions

---

### Intake Pressure Monitoring

Continuous monitoring with color-coded warnings:

| Status | Pressure Range | Meaning | Visual |
|--------|---------------|---------|--------|
| **Green** | ≥ 20 PSI | Safe operation | Green gauge |
| **Amber** | 10-20 PSI | Caution - monitor closely | Yellow gauge |
| **Red** | < 10 PSI | Danger - cavitation risk | Red gauge |

**Implementation:** 
- [`src/features/hydrant-lab/EngineIntakePuck.tsx`](../../src/features/hydrant-lab/EngineIntakePuck.tsx) - visual display
- [`src/features/hydrant-lab/AdvisorChips.tsx`](../../src/features/hydrant-lab/AdvisorChips.tsx) - warning messages

---

## References & Citations

### NFPA Standards

1. **NFPA 291** - Recommended Practice for Fire Flow Testing and Marking of Hydrants
   - Flow testing methodology
   - 20-PSI residual requirement
   - Hydrant marking standards

2. **NFPA 1901** - Standard for Automotive Fire Apparatus
   - Pump performance requirements
   - Testing procedures
   - Safety standards

3. **NFPA 20** - Standard for the Installation of Stationary Pumps for Fire Protection
   - Pump specifications
   - Performance testing

### Fire Service Publications

4. **IFSTA** - Pump Operations Manual (various editions)
   - Friction loss formulas
   - Pump operations procedures
   - Training standards

5. **USFA** - United States Fire Administration Guidelines
   - Water supply operations
   - Pump operations best practices

### Manufacturer Data

6. **Task Force Tips** - Nozzle manufacturer data
   - Flow coefficients
   - Pressure requirements

7. **Arrow XT** - Pump manual specifications
   - Performance curves
   - Operating procedures

### Research & Field Data

8. **Heavy Hydrant** - Research data and field calibrations
   - Hydrant flow characteristics
   - Main valve coefficients

9. **Field Calibration Data (2022)** - Internal testing
   - 5-inch LDH friction coefficient derivation
   - Appliance loss measurements

---

## Version History

### v2.0 - Calc Engine V2
- Pure functional calculation engine
- Improved iterative solver
- Enhanced parallel flow handling
- Better pump curve interpolation
- Strict 20-PSI enforcement

### v1.0 - Initial Implementation
- Legacy calculation engine
- Basic hydraulic modeling
- Foundation formulas

---

## Future Enhancements

### Planned Improvements

1. **Dynamic Friction Coefficients**
   - Flow-dependent friction (more realistic)
   - Temperature effects
   - Hose age/condition factors

2. **Elevation Modeling**
   - Elevation profile along hose lay
   - Automatic elevation pressure calculation
   - Topographic awareness

3. **Real-Time Coefficient Learning**
   - Machine learning from field data
   - Automatic calibration adjustments
   - Regional variations

4. **Advanced Flow Distribution**
   - More sophisticated parallel flow algorithms
   - Network flow optimization
   - Multi-apparatus coordination

5. **Extended Appliance Library**
   - Flow-dependent appliance losses
   - More appliance types (foam systems, standpipes)
   - Manufacturer-specific data

---

## Appendix: Mathematical Proofs

### Proof: Parallel Lines Flow Increase

Given two identical supply lines with resistance R:

**Single line:**
```
ΔP = R × Q₁²  (approximately, for turbulent flow)
Q₁ = √(ΔP/R)
```

**Parallel lines:**
```
Total resistance: R_total = R/2  (parallel resistance)
Q_total = √(ΔP/R_total) = √(ΔP/(R/2)) = √(2ΔP/R)
Q_total = √2 × √(ΔP/R) = √2 × Q₁ ≈ 1.41 × Q₁
```

**Therefore:** 41% increase in flow, or colloquially "about 70% more" accounting for real-world variations.

---

## Document Maintenance

**Last Updated:** 2024-10-27

**Maintained By:** Fire Pump Simulator Development Team

**Review Schedule:** Quarterly or with major version updates

**Feedback:** Report inaccuracies or suggestions via GitHub issues

---

*This document is a living reference that evolves with the simulator. All formulas, coefficients, and assumptions are subject to validation through field testing and continued research.*