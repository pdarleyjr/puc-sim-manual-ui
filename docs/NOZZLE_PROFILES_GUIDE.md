# Nozzle Profiles System - Operator Guide

## Overview

The Nozzle Profiles system provides NFPA-compliant nozzle management for fire pump operations training. It allows administrators to create standardized nozzle presets and operators to select appropriate nozzles for different scenarios.

**Key Benefits:**
- **NFPA-Compliant Hydraulics**: Accurate Freeman formula for smooth-bore nozzles
- **Flexible Configuration**: Per-tab nozzle selection with Admin defaults
- **Training Consistency**: Standardized nozzle configurations across scenarios
- **Real-Time Calculations**: Automatic PDP/GPM updates based on selected nozzles

---

## Key Concepts

### 1. Admin Presets (Global Defaults)

Admin presets are department-wide nozzle configurations managed by instructors. These serve as the default nozzles for each category across all tabs and scenarios.

**Characteristics:**
- Stored in IndexedDB (persistent across sessions)
- Can be marked as "Default" for their category
- Support Import/Export for sharing between departments
- Include metadata: name, notes, creation/update timestamps

**Example Presets:**
```javascript
{
  name: "Crosslay 15/16\" SB",
  category: "crosslay",
  kind: "smooth_bore",
  tipDiameterIn: 0.9375,  // 15/16"
  ratedNPpsi: 50,
  isDefault: true
}
```

### 2. Per-Tab Overrides (Local Selections)

Operators can override Admin defaults on a per-tab basis for hands-on training flexibility.

**Characteristics:**
- Tab-specific (Pump Panel, Hydrant Lab, Scenario Runner)
- Category-specific (crosslay, trash, leader, etc.)
- Timestamp-based (tracked for invalidation)
- Cleared automatically when Admin updates underlying preset

**Use Cases:**
- Testing different nozzle configurations
- Comparing hydraulic performance
- Scenario-specific requirements

### 3. Precedence Rules (Admin Wins)

The system uses timestamp-based precedence to resolve conflicts:

**Resolution Order:**
1. **Local Override** (if present and valid)
   - Check: Is there an override for this tab + category?
   - Validate: Is the preset still valid (not deleted)?
   - Validate: Is the override newer than the preset's last update?

2. **Admin Default** (fallback)
   - Find: Preset marked `isDefault: true` for the category
   - If multiple defaults: Use first match

3. **First Match** (final fallback)
   - Find: Any preset matching the category
   - Return: First available preset

**Invalidation Example:**
```
Time T0: Operator sets local override to Preset A
Time T1: Admin updates Preset A (new timestamp)
Time T2: System detects override is stale → Falls back to Admin default
```

---

## Hydraulics Formulas

### Smooth-Bore Nozzles (Freeman Formula)

**Formula:** `Q = 29.7 × d² × √NP`

Where:
- `Q` = Flow rate (GPM)
- `d` = Tip diameter (inches)
- `NP` = Nozzle pressure (PSI)

**NFPA-Typical Values:**
- Handline: 50 psi NP
- Master Stream: 80 psi NP

**Example:**
```
15/16" tip @ 50 psi
Q = 29.7 × (15/16)² × √50
Q ≈ 185 GPM
```

**Source:** [Engine Company Operations Section 5](https://wordpressstorageaccount.blob.core.windows.net/.../EngineCompanyOperationssection-5-Final-1.pdf)

### Fog Nozzles (Constant Flow)

Fog nozzles maintain rated GPM regardless of pressure (within operating range).

**Configuration:**
- Rated GPM (e.g., 150, 175, 200)
- Rated NP (typically 100 psi standard, 50 psi low-pressure)

**Example:**
```
175 GPM fog @ 100 psi NP
Flow remains 175 GPM across pressure range
```

**Source:** [Utah Valley University - Friction Loss and Nozzle Flow](https://www.uvu.edu/ufra/docs/.../friction_loss_and_nozzle_flow.pdf)

### Friction Loss

**Formula:** `FL = C × (Q/100)² × (L/100)`

Where:
- `FL` = Friction loss (PSI)
- `C` = Friction coefficient (hose-dependent)
- `Q` = Flow rate (GPM)
- `L` = Hose length (feet)

**Standard Coefficients:**
- 1.75" hose: C = 15.5
- 2.5" hose: C = 2.0
- 5" LDH: C = 0.08

**Source:** [National Fire Equipment - Friction Loss Data](https://www.nationalfire.com/media/product_files/Friction_Loss_Data.pdf)

### Pump Discharge Pressure (PDP)

**Formula:** `PDP = NP + FL + Elevation + Appliances`

Where:
- `NP` = Nozzle pressure
- `FL` = Friction loss in hose
- `Elevation` = 0.434 PSI per foot of elevation gain
- `Appliances` = Loss from wyes, gated wye, etc.

**Example:**
```
15/16" SB @ 50 psi NP
200 ft of 1.75" hose
0 elevation
0 appliance loss

FL = 15.5 × (185/100)² × (200/100) ≈ 106 psi
PDP = 50 + 106 + 0 + 0 = 156 psi
```

---

## Workflow

### Creating Nozzle Presets (Admin)

1. Navigate to **Admin → Nozzles**
2. Click **New Preset**
3. Fill in details:
   - **Name**: Descriptive (e.g., "Crosslay 15/16\" SB")
   - **Category**: crosslay, trash, leader, highrise, other
   - **Kind**: smooth_bore, fog_fixed, fog_selectable, fog_automatic
   - **Tip Diameter** (smooth bore): inches (e.g., 0.9375 for 15/16")
   - **Rated NP** (smooth bore): typically 50 psi (handline) or 80 psi (master)
   - **Rated GPM** (fog): e.g., 150, 175, 200
   - **Rated NP** (fog): typically 100 psi (standard) or 50 psi (low-pressure)
   - **Notes**: Optional context
4. Click **Save**

### Setting Category Defaults (Admin)

1. In Nozzle Library, find desired preset
2. Click **Edit**
3. Check **Set as Default for Category**
4. Click **Save**

**Effect:** This preset becomes the Admin default for all operators unless overridden locally.

### Per-Tab Override (Operator)

1. Navigate to desired tab (Pump Panel, Hydrant Lab)
2. Click the **nozzle pill** (e.g., "Crosslay: 15/16\" SB")
3. Select different preset from **Nozzle Picker** modal
4. Click **Confirm**

**Effect:** Selected nozzle applies only to this tab+category combination.

**Clear Override:**
- Click pill again → Select "Use Admin Default"

### Using Nozzles in Scenarios

1. Navigate to **Admin → Scenarios**
2. Edit a scenario
3. In Evolution Table, find **Nozzle** column
4. Select preset from dropdown (or leave as "Use Admin Default")
5. Save scenario

**During Scenario Run:**
- Runner displays selected nozzle name
- Hydraulics calculations use nozzle specs
- PDP/GPM targets reflect nozzle requirements

---

## Import/Export

### Export Presets

1. Navigate to **Admin → Nozzles**
2. Click **Export** button
3. JSON file downloads: `nozzle-profiles-{timestamp}.json`

**Use Cases:**
- Backup department configurations
- Share standardized presets between training facilities
- Version control for configuration changes

### Import Presets

1. Navigate to **Admin → Nozzles**
2. Click **Import** button
3. Select JSON file
4. Review import summary (success count, errors)

**Import Behavior:**
- Presets with matching IDs are updated
- New presets are created
- Invalid presets are skipped (see error report)

**Format:**
```json
{
  "version": 1,
  "exportedAt": 1699876543210,
  "presets": [
    {
      "id": "uuid-here",
      "name": "Crosslay 15/16\" SB",
      "category": "crosslay",
      "kind": "smooth_bore",
      "tipDiameterIn": 0.9375,
      "ratedNPpsi": 50,
      "isDefault": true,
      "createdAt": 1699876543210,
      "updatedAt": 1699876543210
    }
  ]
}
```

---

## Troubleshooting

### Problem: Override Not Showing Up

**Symptoms:**
- Selected nozzle in picker, but discharge still shows old nozzle

**Solutions:**
1. **Check Timestamp:** Admin may have updated the preset after you set the override
   - Clear override and re-select
2. **Check Preset Validity:** Preset may have been deleted
   - Choose a different preset
3. **Refresh Page:** IndexedDB sync issue
   - Hard refresh (Ctrl+F5)

### Problem: Hydraulics Don't Match Expected Values

**Symptoms:**
- PDP/GPM calculations seem incorrect

**Solutions:**
1. **Verify Nozzle Selection:**
   - Click nozzle pill → Confirm correct preset selected
2. **Check Hose Configuration:**
   - Verify hose length and diameter match scenario
3. **Review Preset Specs:**
   - Admin → Nozzles → Edit preset → Verify tip diameter / rated GPM
4. **Check for Elevation/Appliances:**
   - System includes 0.434 PSI/ft elevation
   - Appliance loss if specified

### Problem: Can't Delete Preset

**Symptoms:**
- Delete button shows confirmation but preset remains

**Solutions:**
1. **Check Scenario References:**
   - System warns if scenarios use this preset
   - Update scenarios first, then delete

2. **Check Default Status:**
   - If preset is default for category, reassign default first

### Problem: Import Fails

**Symptoms:**
- Import shows errors or skips presets

**Solutions:**
1. **Validate JSON Format:**
   - Ensure `version: 1` present
   - Check for syntax errors
2. **Check Schema:**
   - Required fields: id, name, category, kind, createdAt, updatedAt
   - Optional fields must match types (e.g., tipDiameterIn as number)
3. **Review Error Messages:**
   - Import summary lists specific issues

---

## Best Practices

### For Instructors (Admins)

1. **Create Department Standards**
   - Document your department's standard nozzles
   - Create presets matching inventory
   - Mark appropriate defaults for each category

2. **Use Descriptive Names**
   - Good: "Crosslay 15/16\" SB @ 50 psi"
   - Bad: "Nozzle 1"

3. **Include Notes**
   - Document make/model if relevant
   - Note any special considerations
   - Reference department SOPs

4. **Export Regularly**
   - Backup configurations weekly
   - Version control in Git if possible
   - Share with fellow instructors

5. **Communicate Updates**
   - Notify operators when defaults change
   - Explain rationale for changes
   - Update training materials

### For Operators (Students)

1. **Understand Precedence**
   - Admin defaults apply unless you override
   - Overrides are tab-specific
   - Changes persist across sessions

2. **Clear Overrides When Done**
   - Return to Admin defaults after testing
   - Avoid confusion for next user

3. **Experiment Safely**
   - Use per-tab overrides to test different nozzles
   - Compare hydraulic performance
   - Learn practical implications

4. **Check Nozzle Before Scenarios**
   - Confirm correct nozzle selected
   - Verify it matches scenario requirements
   - Understand target PDP/GPM

---

## Technical Reference

### Nozzle Categories

| Category | Description | Typical Use |
|----------|-------------|-------------|
| `crosslay` | 1¾" handlines | Initial attack, structure fires |
| `trash` | Front trash line | Quick deployment, exposure protection |
| `leader` | Skid load/leader lines | Extended attack, versatility |
| `highrise` | 2½" / FDC / Standpipe | High-rise, large water supply |
| `other` | Deck guns, specialty | Master streams, defensive ops |

### Nozzle Kinds

| Kind | Description | Flow Calculation |
|------|-------------|------------------|
| `smooth_bore` | Solid stream tip | Freeman: Q = 29.7 × d² × √NP |
| `fog_fixed` | Fixed gallonage fog | Rated GPM at rated NP |
| `fog_selectable` | User-selectable GPM | Selected GPM at rated NP |
| `fog_automatic` | Auto-adjusting fog | Target GPM maintained |

### Tab IDs

| Tab ID | Description |
|--------|-------------|
| `panel` | Pump Panel (mobile UI) |
| `hydrant_lab` | Hydrant Lab (canvas UI) |
| `scenarios_runner` | Scenario Runner |
| `admin_scenarios` | Scenario Admin |
| `admin_nozzles` | Nozzle Admin |

### Storage Keys

| Key | Purpose |
|-----|---------|
| `nozzle_presets` | IndexedDB store for presets |
| `nozzle_local_overrides` | IndexedDB store for overrides |

---

## API Reference

### useNozzleProfiles Store

```typescript
// Get effective nozzle (respects precedence)
const preset = useNozzleProfiles.getState().getEffectiveNozzle('panel', 'crosslay');

// Set local override
await store.setLocalOverride('panel', 'crosslay', 'preset-id-here');

// Clear local override
await store.clearLocalOverride('panel', 'crosslay');

// Create preset (Admin)
await store.createPreset({
  name: 'My Nozzle',
  category: 'crosslay',
  kind: 'smooth_bore',
  tipDiameterIn: 0.9375,
  ratedNPpsi: 50
});
```

### useDischargeCalc Hook

```typescript
import { useDischargeCalc } from '@/features/nozzle-profiles/hooks/useDischargeCalc';

const result = useDischargeCalc({
  tabId: 'panel',
  category: 'crosslay',
  hoseLengthFt: 200,
  hoseDiameterIn: 1.75,
  elevationGainFt: 0,
  applianceLossPsi: 0
});

// result = { gpm, pdp, np, fl, elevation, appliance } or null
```

### computeDischargeWithNozzle Function

```typescript
import { computeDischargeWithNozzle } from '@/engine/calcEngineV2';

const result = computeDischargeWithNozzle(
  preset,        // NozzlePreset or null
  200,           // hose length (ft)
  1.75,          // hose diameter (in)
  0,             // elevation gain (ft)
  0              // appliance loss (psi)
);

// Returns: { gpm, pdp, np, fl, elevation, appliance }
```

---

## Change Log

### Version 1.0 (Initial Release)

**Features:**
- Admin preset management (CRUD)
- Per-tab override system
- NFPA-compliant hydraulics
- Import/Export functionality
- Scenario integration
- Timestamp-based precedence
- IndexedDB persistence

**Testing:**
- 155+ unit tests
- Freeman formula validation
- Precedence logic verification
- Integration tests

---

## Support

For questions or issues:
1. Review this guide thoroughly
2. Check Troubleshooting section
3. Verify NFPA sources cited
4. Contact training coordinator

**External Resources:**
- [NFPA 1410](https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=1410) - Training Standard
- [IFSTA Pump Operations Manual](https://www.ifsta.org/)
- [Utah Valley University - Hydraulics Guide](https://www.uvu.edu/ufra/docs/)