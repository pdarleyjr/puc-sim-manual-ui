# Hydrant Lab Technical Deep Dive

## 1. Introduction & Core Philosophy

This document provides a comprehensive technical breakdown of the Hydrant Lab simulator. The core philosophy is to create a realistic, physics-based simulation of fire ground hydraulics that is both educational and engaging. The calculations are not based on arbitrary percentages but are derived from foundational fluid dynamics principles, validated against NFPA standards and real-world field research.

The simulation is divided into two main systems:
1.  **The Supply Side:** Models the flow of water from the hydrant, through various supply hoses, to the pumper's intake.
2.  **The Discharge Side:** Models the fire pump boosting pressure and sending water out through discharge lines to nozzles.

These two systems are interconnected and constantly balanced by an iterative solver to find a stable equilibrium, just like in a real-world scenario.

## Table of Contents
1.  [Introduction & Core Philosophy](#1-introduction--core-philosophy)
2.  [System Architecture](#2-system-architecture)
3.  [The Supply-Side Hydraulic Model](#3-the-supply-side-hydraulic-model)
    -   [3.1. Hydrant Capacity (The Source)](#31-hydrant-capacity-the-source)
    -   [3.2. Hose Line Resistance](#32-hose-line-resistance)
    -   [3.3. The Iterative Flow Solver](#33-the-iterative-flow-solver)
4.  [The Discharge-Side Hydraulic Model](#4-the-discharge-side-hydraulic-model)
    -   [4.1. The Fire Pump: A Pressure Booster](#41-the-fire-pump-a-pressure-booster)
    -   [4.2. Pump Limits: Governor & Cavitation](#42-pump-limits-governor--cavitation)
    -   [4.3. Discharge Line Calculations](#43-discharge-line-calculations)
5.  [State Management with Zustand](#5-state-management-with-zustand)
    -   [5.1. The `useHydrantLab` Store](#51-the-usehydrantlab-store)
    -   [5.2. The `recompute()` Loop](#52-the-recompute-loop)
6.  [UI Implementation with React](#6-ui-implementation-with-react)
    -   [6.1. `DischargePanel.tsx`](#61-dischargepaneltsx)
7.  [Testing & Validation](#7-testing--validation)

---

## 2. System Architecture

The simulation is built as a reactive system using **React** for the UI and **Zustand** for state management. The core logic is contained within a central state store (`useHydrantLab`), which holds all the user-configurable parameters and the calculated simulation results.

The flow of data is as follows:
1.  A user interacts with a UI component (e.g., changes the governor pressure).
2.  The UI component calls an action in the Zustand store (e.g., `setGovernor(175)`).
3.  The action updates the state and triggers the `recompute()` function.
4.  `recompute()` calls the hydraulic solver (`solveHydrantSystem`) with the new state.
5.  The solver calculates the new `totalInflowGpm`, `engineIntakePsi`, etc.
6.  `recompute()` then calls the discharge calculator (`computeDischarges`) with the updated supply values.
7.  The results from both calculations are saved back into the Zustand store.
8.  React components subscribed to the store automatically re-render with the new data.

This creates a closed-loop system where any change immediately propagates through the entire hydraulic model, ensuring the UI is always synchronized with the underlying physics.

---

## 3. The Supply-Side Hydraulic Model

The supply side is the heart of the simulation. It determines the total amount of water available to the pump.

### 3.1. Hydrant Capacity (The Source)

The maximum flow from a hydrant is not infinite. It's limited by the size of the main valve and the static pressure in the water main. We model this using an empirical formula derived from field data. A typical hydrant has a 5.25" main valve.

**Key Insight:** The flow is proportional to the square root of the available pressure drop, capped at a minimum residual of 20 psi (per NFPA 291).

```typescript
// From: src/features/hydrant-lab/math.ts

function hydrantMainValveCapacity(staticPsi: number): number {
  const residualFloor = 20;
  const availablePressure = Math.max(0, staticPsi - residualFloor);
  
  // Empirical coefficient based on 5.25" valve
  // At 80 psi static (60 psi available), max was ~2700 GPM -> K ≈ 348
  const K = 348;
  return K * Math.sqrt(availablePressure);
}
```
This function establishes the absolute maximum GPM the hydrant can produce, which becomes a hard ceiling for the entire system.

### 3.2. Hose Line Resistance

Not all hoses are created equal. The friction loss in a hose determines how much of the hydrant's pressure is lost before it reaches the pump. We use the standard fire service formula: `FL = C × (Q/100)² × (L/100)`.

The most critical part is the coefficient `C`.

```typescript
// From: src/features/hydrant-lab/math.ts

const C_5IN = 0.025;  // 5" LDH - field-calibrated
const C_3IN = 0.8;    // 3" hose per technical guide
```
**Key Insight:** A 3" hose has **32 times more resistance** per foot than a 5" hose. This is why a 3" side line provides almost no benefit when a 5" steamer is already flowing heavily.

We abstract this into a `lineResistance` function that the solver uses.

```typescript
// From: src/features/hydrant-lab/math.ts

function lineResistance(diameterIn: number, lengthFt: number, extraPsi: number): number {
  const C = diameterIn === 5 ? C_5IN : C_3IN;
  const L = lengthFt / 100;
  // Simplified resistance factor used by the solver
  return C * L + extraPsi / 100;
}
```

### 3.3. The Iterative Flow Solver

This is the core of the physics engine. It finds the equilibrium flow and pressure across multiple supply lines. It does *not* use a 70/30 split; that split is an *emergent property* of the physics when using certain hose setups.

**The Physics:**
1.  Water flows like electricity: `Flow = √(Pressure Drop / Resistance)`.
2.  The total resistance of parallel hoses is `1 / R_total = 1/R₁ + 1/R₂ + ...`.
3.  As flow increases, friction loss increases, which lowers the pressure, which in turn reduces the flow. The solver finds the point where these forces balance out.

**The Algorithm (`solveHydrantSystem`):**
1.  **Calculate Resistances:** Determine the `lineResistance()` for each connected and open supply leg.
2.  **Calculate Total Resistance:** Combine the individual resistances in parallel.
3.  **Estimate Initial Flow:** Make a starting guess for the total flow based on the total resistance and the available pressure from the hydrant.
4.  **Iterate to Converge (20 times):**
    a.  **Distribute Flow:** Temporarily distribute the `estimatedFlow` among the legs, proportional to their conductance (1 / resistance).
    b.  **Calculate Friction Loss:** For this temporary flow, calculate the actual friction loss in each leg.
    c.  **Update Hydrant Residual:** The pressure at the hydrant drops based on the calculated friction loss.
    d.  **Calculate New Flow:** Based on the *new* lower pressure, calculate what the flow *should* have been.
    e.  **Check for Convergence:** If the new flow is very close to the `estimatedFlow` from step 4a, we have found the stable equilibrium and can exit the loop.
    f.  **Damp & Repeat:** If not converged, average the old estimate and the new flow to prevent oscillation, and repeat the loop.
5.  **Apply Ceilings:** The final converged flow is capped by the `hydrantMainValveCapacity()` and the `governorLimit`.
6.  **Calculate Final Intake PSI:** The final intake pressure is the weighted average of the pressures arriving from each supply leg.

This iterative approach ensures that the system behaves realistically. For example, adding a high-resistance 3" line will naturally draw very little flow compared to an existing 5" line because the solver finds an equilibrium where the massive friction loss in the 3" line chokes its own flow.

This ensures that if the supply is insufficient to meet the total demand, all lines are throttled back equally. A UI indicator shows what percentage of the required flow is being delivered.

---

## 5. State Management with Zustand

Zustand is a small, fast, and scalable state-management solution. We use it to hold the entire state of the Hydrant Lab in a single, centralized store.

### 5.1. The `useHydrantLab` Store

The store, defined in `src/features/hydrant-lab/store.ts`, contains everything needed for the simulation:
-   **User Inputs:** `staticPsi`, `governorPsi`, `legs`, `dischargeLines`, etc.
-   **Calculated Outputs:** `hydrantResidualPsi`, `totalInflowGpm`, `engineIntakePsi`, `totalDischargeFlowGpm`.
-   **Status Flags:** `pumpCavitating`, `governorLimited`.
-   **Actions:** Functions that modify the state, like `setGovernor`, `addDischargeLine`, and `toggleGate`.

Every variable that can change or be calculated is held in this store.

```typescript
// From: src/features/hydrant-lab/store.ts (abbreviated)

export interface DischargeLine {
  id: string
  hoseDiameterIn: 1.75 | 2.5 | 3 | 4 | 5
  hoseLengthFt: number
  nozzleType: NozzleType
  gateOpen: boolean
  calculatedGpm: number
  requiredGpm: number
  frictionLossPsi: number
}

type LabState = {
  // Inputs
  staticPsi: number
  legs: Record<PortId, Leg | null>
  governorPsi: number
  dischargeLines: DischargeLine[]
  pumpDischargePressurePsi: number
  
  // Outputs
  hydrantResidualPsi: number
  engineIntakePsi: number
  totalInflowGpm: number
  totalDischargeFlowGpm: number
  pumpCavitating: boolean
  
  // Actions
  setGovernor: (psi: number) => void
  addDischargeLine: (...) => void
  recompute: () => void
}
```

### 5.2. The `recompute()` Loop

This function is the conductor of the orchestra. **Every time a user changes any parameter, this function is called.**

Its job is simple but critical:
1.  **`get()`** the current, complete state of the world.
2.  Call `solveHydrantSystem()` with the current state to get the latest supply-side numbers.
3.  Call `computeDischarges()` with the *new* supply numbers to get the latest discharge-side numbers.
4.  **`set()`** the store with all the new calculated values.

```typescript
// From: src/features/hydrant-lab/store.ts

recompute: () => {
  const s = get() // Get current state
  
  // 1. Compute supply side
  const { engineIntakePsi, totalInflowGpm, hydrantResidualPsi } =
    solveHydrantSystem(s)
  
  // 2. Compute discharge side (using new supply numbers)
  const { 
    totalFlow, 
    cavitating, 
    governorLimited,
    updatedLines 
  } = computeDischarges(
    s.dischargeLines,
    s.pumpDischargePressurePsi,
    totalInflowGpm, // <-- Result from step 1
    engineIntakePsi, // <-- Result from step 1
    s.governorPsi
  )
  
  // 3. Update state with all new values
  set({ 
    engineIntakePsi, 
    totalInflowGpm, 
    hydrantResidualPsi,
    totalDischargeFlowGpm: totalFlow,
    pumpCavitating: cavitating,
    governorLimited,
    dischargeLines: updatedLines
  })
}
```
This ensures a consistent, one-way data flow and prevents race conditions or desynchronized states. A change is made -> the entire system is recalculated -> the UI updates.

---

## 6. UI Implementation with React

The UI, built with React and TypeScript, is composed of "dumb" components that simply display data from the Zustand store and call actions when the user interacts with them.

### 6.1. `DischargePanel.tsx`

This component is a perfect example. It subscribes to the `useHydrantLab` store and renders the discharge line controls.

```tsx
// From: src/features/hydrant-lab/DischargePanel.tsx (simplified)

export function DischargePanel() {
  // Subscribe to the entire store
  const s = useHydrantLab(); 
  
  return (
    <div>
      {/* PDP Slider */}
      <input
        type="range"
        value={s.pumpDischargePressurePsi}
        // Changing the slider calls the action in the store
        onChange={(e) => s.setPDP(parseInt(e.target.value))}
      />
      
      {/* Cavitation Warning */}
      {s.pumpCavitating && (
        <div>⚠️ CAVITATION RISK</div>
      )}
      
      {/* List of Discharge Lines */}
      {s.dischargeLines.map(line => (
        <DischargeLineCard key={line.id} line={line} />
      ))}
    </div>
  )
}
```
The component doesn't contain any logic itself. It reads values like `s.pumpCavitating` directly from the store and calls actions like `s.setPDP`. When `setPDP` triggers a `recompute`, the store updates, and this component automatically re-renders with the new values.

---

## 7. Testing & Validation

The core hydraulic logic is rigorously tested using **Vitest**. The test suite in `tests/hydraulics.test.ts` validates the formulas against:
-   **Industry Standards:** Textbook examples from the USFA training manuals.
-   **NFPA Standards:** Pump curve test points from NFPA 1911.
-   **Field Research:** Validates that the model replicates the results observed in the "Heavy Hydrant Hookups" articles, such as the 70/30 flow split and the negligible benefit of adding a 3" side line.
-   **Boundary Conditions:** Ensures the math holds up with zero flow, zero length hoses, and other edge cases to prevent `NaN` errors.

This extensive testing provides confidence that the simulation is not just internally consistent but also a faithful representation of real-world fire ground hydraulics.