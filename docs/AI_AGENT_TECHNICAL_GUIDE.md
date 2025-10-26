# AI Agent Technical Guide: Fire Ground Hydraulics &amp; Operations

## 1. Core Principles &amp; Definitions

This section provides foundational knowledge for all hydraulic calculations and operational logic.

| Concept | Definition/Standard | Key Data |
| :--- | :--- | :--- |
| **Heavy Hydrant Hookup** | Connecting LDH to multiple hydrant ports to maximize flow potential. Also known as "dressing the hydrant." | Essential for large-scale operations. |
| **20-PSI Rule** | NFPA 291 hydrant flow ratings are established while maintaining a **residual main pressure** of 20 psi with all outlets in use. | Minimum residual **main** pressure = 20 psi. |
| **Residual Main Pressure** | Pressure in the municipal water main during flow. | Must remain > 20 psi to prevent main collapse or contamination. Measured with a gauge on the hydrant. |
| **Residual Intake Pressure**| Pressure at the eye of the pumper's impeller during flow. Measured by the master intake/compound gauge. | Will be lower than residual main pressure due to friction loss. Can operate < 20 psi if hydrant pressure is confirmed > 20 psi. |
| **Cavitation** | Formation of vapor bubbles in a pump when attempting to discharge more water than is being received. | Prevented by maintaining a minimum of 20 psi residual intake pressure during pressure boosting operations. Sounds like gravel in the pump and is highly destructive. |

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
- **Friction Loss:** The primary obstacle to flow. Governed by a variant of the Hazen-Williams formula (`p = (4.52 × Q¹·⁸⁵) / (C¹·⁸⁵ × d⁴·⁸⁷)`). The key takeaway is that pressure loss increases exponentially with flow (Q) but decreases exponentially with hose diameter (d).
- **Appliance Friction Loss:**
  - Assume **10 psi** loss for each appliance (wyes, gates, elbows) in a layout flowing **≥ 350 GPM**.
  - Assume **25 psi** loss for any master stream appliance, regardless of flow.

### 3.2. Hose Data Tables

**1.75" Double Jacket Attack Hose (Combat Ready)**

| Service Test (psi) | Proof Test (psi) | Coefficient of Flow (C) |
| :--- | :--- | :--- |
| 500 | 1000 | 15.5 |

**3" Double Jacket Hose (Key-Lite)**

| Service Test (psi) | Proof Test (psi) | Coefficient of Flow (C) |
| :--- | :--- | :--- |
| 400 | 800 | 0.8 |

---

## 4. Operational Procedures & Flow Dynamics

### 4.1. Heavy Hydrant Hookups

- **Principle:** By using multiple LDH lines from a single hydrant, the total flow is divided, dramatically reducing the friction loss in each individual line.
- **Flow Division (Observed Data):** When double tapping with LDH on the steamer and one side port:
  - ~**70%** of total flow travels through the steamer port line.
  - ~**30%** of total flow travels through the side port line.
- **Impact:** This 30% flow diversion reduces friction loss in the main steamer line by approximately **50%**. This is the primary reason for the significant rise in residual intake pressure at the pumper.

### 4.2. Test Data Highlights (Flowing 2,000 GPM from a single hydrant)

| Configuration | Pumper Flow (GPM) | Residual Intake (psi) | Hydrant Pressure (psi) | Delta (psi) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Single Tap** (1x 5" on steamer) | 2,000 | 25 | 52 | 27 | Baseline |
| **Double Tap** (1x 5", 1x 2.5") | 2,000 | 25 | 52 | 27 | Ineffective. No improvement. |
| **Double Tap** (2x 5" lines) | 2,000 | **40** | 52 | 12 | **60% increase in residual intake pressure.** |
| **Triple Tap** (3x 5" lines) | 2,000 | **45** | 52 | 7 | Additional 12.5% increase over double tap. |
| **Extreme Flow Triple Tap**| 2,700 | 15 | 30 | 15 | Operator can safely go below 20 psi intake if hydrant pressure is monitored and remains > 20 psi. |

### 4.3. Hydrant Pressure Boosting Procedure (Using Hydrant Assist Valve)

A specialized operation to increase pressure in a supply line from a weak hydrant or for a long lay.

1.  **Positioning:** Apparatus close to the hydrant.
2.  **Connections:**
    *   5" hose from **unclappered side discharge** of assist valve to **main pump intake**.
    *   5" hose from **clappered side discharge** of assist valve to a **large diameter pump discharge**.
3.  **Initial Charging:** Turn hydrant assist handle to **Boost position**.
4.  **Water Flow:** Bleed air at the intake and open the intake to fill the pump.
5.  **Boosting:** Open the large diameter discharge. Increase throttle until the clapper valve in the assist device opens, boosting pressure in the supply line.
6.  **Safety Check:** Monitor residual intake pressures, maintaining a **minimum of 20 psi** to prevent apparatus cavitation.

---

## 5. Apparatus & Pumping

### 5.1. Fire Apparatus General Specifications (Arrow XT™)

- **Pump:** Centrifugal, Waterous. Can be single-stage or two-stage.
- **Pump Engagements:** Midship pumps are common, engaged via a split-shaft gear case.
- **Pump Panel:** Includes master intake and discharge gauges, pressure governor controls, and valve controls.

### 5.2. Pump Theory & Operations

- **Centrifugal Pump:** A non-positive displacement pump. Imparts velocity to water and converts it to pressure. Cannot pump air and is not self-priming.
- **Priming:** Positive displacement pumps (rotary vane or rotary gear) are used as primers to evacuate air, allowing atmospheric pressure to force water into the centrifugal pump for drafting operations.
- **Two-Stage Pumps:**
  - **PRESSURE (Series) Mode:** Water is routed through both impellers sequentially for maximum pressure at lower volumes. Use when PDP > 250 psi is required.
  - **VOLUME (Parallel) Mode:** Water is fed to both impellers simultaneously for maximum volume at lower pressures. Use when pumping ≥ 70% of the pump's rated capacity.
- **Pressure Governor:** An electronic device that regulates engine speed to maintain a set pump discharge pressure, automatically adjusting for changes in flow.
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

- **Flow from Solid Stream Nozzle (GPM):**
  `GPM = 29.7 * C_d * d² * sqrt(NP)`
  - `C_d`: Coefficient of discharge (typically 0.90 for a well-rounded hydrant outlet, 0.97 for playpipes)
  - `d`: Orifice diameter in inches
  - `NP`: Nozzle Pressure (Pitot reading) in psi

- **Pump Discharge Pressure (PDP):**
  `PDP = NP + TPL`
  - `NP`: Nozzle Pressure required
  - `TPL`: Total Pressure Loss (Friction Loss + Appliance Loss + Elevation Loss)

- **Elevation Pressure (EP):**
  `EP (psi) = 0.5 * H (feet)`
  OR
  `EP (psi) = 5 * (Number of stories - 1)`

- **Friction Loss (FL) per 100ft of hose:**
  `FL = C * Q² * L`
  - `C`: Hose friction loss coefficient (see table 3.2)
  - `Q`: Flow in hundreds of GPM (GPM / 100)
  - `L`: Hose length in hundreds of feet (Length / 100)