// ... existing code ...
This iterative approach ensures that the system behaves realistically. For example, adding a high-resistance 3" line will naturally draw very little flow compared to an existing 5" line because the solver finds an equilibrium where the massive friction loss in the 3" line chokes its own flow.

---

## 4. The Discharge-Side Hydraulic Model

Once the water reaches the pump, the discharge side calculates how that water is distributed to the various nozzles.

### 4.1. The Fire Pump: A Pressure Booster

A crucial concept is that a fire pump does not *create* water; it *boosts pressure*. A pump rated for 1500 GPM achieved that rating by drafting from a static source. When supplied by a hydrant, the hydrant provides the volume, and the pump's main job is to increase the pressure from the intake level (e.g., 40 psi) to the desired Pump Discharge Pressure (PDP) (e.g., 150 psi). The total flow is ultimately limited by the supply from the hydrant.

### 4.2. Pump Limits: Governor & Cavitation

A pump cannot flow infinite water, even with a perfect supply. It has two primary physical limitations: the engine's RPM and the risk of cavitation.

**A. The Governor Limit:**
The engine's governor limits the revolutions per minute (RPM), which in turn limits the pump's output based on the required pressure. We model this using the standard NFPA 1911 pump performance curve.

**Key Insight:** A pump's GPM rating is specified at 150 psi. At higher pressures, the available GPM drops significantly.
-   **100%** of rated GPM @ **150 psi**
-   **70%** of rated GPM @ **200 psi**
-   **50%** of rated GPM @ **250 psi**

This is implemented in `pumpCurveMaxGpm` and used as a hard ceiling on the total flow.

```typescript
// From: src/features/hydrant-lab/store.ts logic (simplified)

let governorPercentage = 1.0;
if (governorPsi > 250) {
  governorPercentage = 0.50;
} else if (governorPsi > 200) {
  // Interpolate between 50% and 70%
  governorPercentage = 0.50 + ((250 - governorPsi) / 50) * 0.20;
} else if (governorPsi > 150) {
  // Interpolate between 70% and 100%
  governorPercentage = 0.70 + ((200 - governorPsi) / 50) * 0.30;
}
const governorLimit = pumpDraftRating * governorPercentage;
```

**B. Cavitation:**
Cavitation occurs when the pump tries to discharge more water than is available at the intake, causing the intake pressure to drop below the vapor pressure of water. This creates destructive vapor bubbles.

**Key Insight:** We model this as a simple but effective rule: the intake pressure must remain above a minimum threshold (Net Positive Suction Head). This threshold increases as PDP increases, because a harder-working pump is more susceptible to cavitation.

```typescript
// From: src/features/hydrant-lab/store.ts

const minIntakeForPDP = pdpPsi > 200 ? 15 : pdpPsi > 150 ? 10 : 5;
const cavitating = intakePsi < minIntakeForPDP;

if (cavitating) {
    // If cavitating, flow is dramatically and unstably reduced.
    actualFlow = Math.min(actualFlow, supplyGpm * 0.5);
}
```

### 4.3. Discharge Line Calculations

The calculation for the discharge side is more straightforward than the supply side, as the flow is driven by the pump.

**The Algorithm (`computeDischarges`):**
1.  **Calculate Total Demand:** For each open discharge line:
    a.  Determine the required GPM of its nozzle. For fog nozzles, this is a constant value. For smooth bore nozzles, it's calculated based on the nozzle pressure using the Freeman formula: `GPM = 29.7 × d² × √NP`.
    b.  Nozzle Pressure (NP) is the Pump Discharge Pressure (PDP) minus the friction loss in the hose.
    c.  Sum the demands of all lines to get `totalDemand`.
2.  **Determine Available Flow:** The total flow the pump can actually deliver is the **minimum** of:
    -   `totalDemand` (what the nozzles are asking for)
    -   `supplyGpm` (what the hydrant is providing)
    -   `governorLimit` (what the engine can physically do)
3.  **Check for Cavitation:** If the pump is cavitating, slash the `availableFlow` to simulate the performance drop.
4.  **Distribute Flow:** Distribute the final `availableFlow` proportionally among all open discharge lines based on their individual demands.

This ensures that if the supply is insufficient to meet the total demand, all lines are throttled back equally. A UI indicator shows what percentage of the required flow is being delivered.