// Hydraulic Constants for Fire Pump Assignments

// Hose friction coefficients (C values for FL = C*(Q/100)^2*(L/100))
export const C_175_FOG = 6.59;         // 1¾″ Key Combat Ready coefficient (~20.2 psi/100′ @175 gpm)
export const C_3IN_BIG10 = 1.20;       // 3″ Big-10 chosen for FL≈2.7 psi/100′ at 150 gpm

// Nozzle pressures (psi)
export const NP_SMOOTHBORE_HAND = 50;  // handline smooth bore NP 50 psi
export const NP_MASTER_STREAM = 80;    // master stream smooth bore 80 psi
export const BLITZ_NP_STD = 100;       // Max-Force standard mode 100 psi
export const BLITZ_NP_LOW = 55;        // Max-Force low-pressure 55 psi

// Appliance losses
export const BLITZ_APPLIANCE_LOSS_500 = 22; // psi at 500 gpm (non-oscillating)
export const STANDPIPE_ALLOWANCE = 25;      // psi for valves/PRVs/system

// Elevation & geometry
export const FEET_PER_FLOOR = 10;      // elevation conversion helper
export const PSI_PER_FOOT = 0.434;     // exact hydrostatic head constant

// High-rise pack specifications
export const HRP_LENGTH = 200;         // 200′ high-rise pack length
export const HRP_TARGET_GPM = 150;     // department target for 7/8″ tip handline flow

// Device limits
export const BLITZFIRE_MAX_GPM = 500;
export const BLITZFIRE_MAX_PSI = 175;

// Smooth bore tip diameter (inches)
export const SMOOTHBORE_TIP_DIAMETER = 0.875; // 7/8″

// Master Stream / Deck Gun (piped, no supply hose)
export const NP_MASTER = 80;                    // psi (master stream smooth bore standard)
export const K_MONITOR = 25 / (1200 * 1200);   // ≈1.736e-5 psi/(gpm^2) - device loss @ 1200 gpm
export const K_PIPED = 12 / (1000 * 1000);     // =1.2e-5 psi/(gpm^2) - waterway loss @ 1000 gpm

// Deck gun tip diameters (inches)
export const TIP_DIAMETERS = {
  '1_3/8': 1.375,
  '1_1/2': 1.5,
  '1_3/4': 1.75,
} as const;

// Cavitation thresholds
export const CAVITATION_INTAKE_THRESHOLD = 2;   // psi - near-dry threshold
export const CAVITATION_RPM_THRESHOLD = 1200;   // rpm - high demand threshold
export const CAVITATION_DISCHARGE_THRESHOLD = 150; // psi - high demand threshold

// Tank Fill / Recirculate constants
export const FILL_QMAX_GPM = 250;                 // Max tank-fill flow when fully open (hydrant supplied)
export const INTAKE_SAG_PSI_PER_GPM = 0.02;       // Intake sag per gpm of tank fill (hydrant only)

// Supply hose friction (5″ LDH and 3″)
export const K_SUPPLY_5IN = 6.5e-6;               // psi/(gpm^2); ≈26 psi per 100' @ 2000 gpm
export const K_SUPPLY_3IN = 4.55e-5;               // psi/(gpm^2); ≈7x the 5" loss

// Intake plumbing loss (Q² model, not constant)
export const K_INTAKE_PLUMB = 6.4e-6;            // psi/(gpm^2); ~26 psi at 2000 gpm (reduced 5% for multi-leg headroom)

// Hydrant body losses (small constant)
export const LOSS_HYDRANT_BODY = 2;               // psi (internal hydrant valve/body losses)

// Flow split geometry factor (steamer weight for 70/30 split)
export const F_STEAMER_WEIGHT = 2.3;              // Geometry factor for steamer advantage