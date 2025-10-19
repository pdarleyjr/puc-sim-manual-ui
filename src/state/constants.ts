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