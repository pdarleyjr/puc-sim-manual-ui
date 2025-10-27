# Hydraulics Testing Methodology

## Overview

This document describes the comprehensive testing approach for the Fire Pump Simulator's hydraulic calculations. Our testing strategy ensures accuracy, reliability, and compliance with NFPA standards through a multi-layered approach combining unit tests, integration tests, golden scenarios, and field validation.

**Testing Philosophy:** Validate against industry standards, maintain regression coverage, and ensure real-world accuracy within acceptable tolerances.

---

## Test Coverage

### Unit Tests

**Location:** [`tests/calcEngineV2.test.ts`](../../tests/calcEngineV2.test.ts), [`tests/hydraulics.test.ts`](../../tests/hydraulics.test.ts)

**Coverage Areas:**

1. **Friction Loss Calculations** (±1% tolerance)
   - 5-inch LDH with field-calibrated coefficient (0.025)
   - 2.5-inch attack line (2.0 coefficient)
   - 1.75-inch attack line (15.5 coefficient)
   - Variable flow rates: 100-2500 GPM
   - Variable lengths: 50-500 feet

2. **Nozzle Flow (Freeman Formula)** (±1% tolerance)
   - Smooth bore nozzles: 7/8", 1", 1-1/8", 1-1/4", 1-3/8", 1-1/2"
   - Nozzle pressures: 45-80 PSI
   - Expected flow validation against published flow tables

3. **Hydrant Flow (NFPA 291)** (±2% tolerance)
   - Static pressure range: 40-80 PSI
   - Test flows: 250-1500 GPM
   - Residual pressure calculations
   - Available flow at 20 PSI residual

4. **Pump Performance Curves (NFPA 1901)** (±1 PSI tolerance)
   - 50% rated flow → 110% rated pressure
   - 100% rated flow → 100% rated pressure
   - 150% rated flow → 65% rated pressure
   - Multiple pump sizes: 1000, 1250, 1500, 2000 GPM

5. **Required PDP Calculations** (±2 PSI tolerance)
   - Nozzle pressure requirements
   - Friction loss accumulation
   - Appliance losses
   - Elevation pressure (future)

**Test Execution:**
```bash
cd puc-sim-manual-ui
npm test -- calcEngineV2.test.ts
npm test -- hydraulics.test.ts
```

---

### Integration Tests

**Location:** [`tests/hydrant.test.tsx`](../../tests/hydrant.test.tsx), [`tests/panel.test.tsx`](../../tests/panel.test.tsx)

**Coverage Areas:**

1. **Store State Management**
   - Zustand store operations
   - State updates and reactivity
   - Configuration persistence

2. **Component Rendering**
   - React component lifecycle
   - Conditional rendering logic
   - Visual element presence

3. **User Interactions**
   - Click handlers
   - Input changes
   - Form submissions
   - Drag-and-drop operations (Hydrant Lab)

4. **Flow Distribution Logic**
   - Supply line configurations
   - Discharge line management
   - Parallel flow calculations
   - Real-time updates

**Test Execution:**
```bash
npm test -- hydrant.test.tsx
npm test -- panel.test.tsx
```

---

## Golden Scenarios

These scenarios represent validated reference cases with known correct outcomes. They serve as benchmarks for regression testing and validation.

### Scenario 1: Single 5-inch Supply @ 50 PSI Static

**Purpose:** Validate NFPA 291 flow calculation and 5-inch LDH friction coefficient

**Setup:**
```yaml
Hydrant:
  Static Pressure: 50 PSI
  Test Flow: 500 GPM
  Residual Pressure @ Test: 40 PSI

Supply Line:
  Type: 5-inch LDH
  Length: 100 feet
  Configuration: Single line

Discharge:
  None (testing supply only)
```

**Expected Results:**

1. **Available Flow @ 20 PSI Residual:**
   ```
   Q₂ = 500 × √((50 - 20) / (40 - 20))
   Q₂ = 500 × √(30/20)
   Q₂ = 500 × √1.5
   Q₂ ≈ 612 GPM
   ```
   **Tolerance:** ±10 GPM (±1.6%)

2. **Friction Loss @ 500 GPM:**
   ```
   FL = 0.025 × (500/100)² × (100/100)
   FL = 0.025 × 25 × 1
   FL = 0.625 PSI
   ```
   **Tolerance:** ±0.1 PSI

3. **Intake Pressure:**
   ```
   Intake = Static - Friction Loss
   Intake = 50 - 0.625
   Intake ≈ 49.4 PSI
   ```
   **Tolerance:** ±1 PSI

**Test Implementation:** [`tests/hydraulics.test.ts`](../../tests/hydraulics.test.ts) - "single supply line scenario"

---

### Scenario 2: Attack Line with Smooth Bore

**Purpose:** Validate Freeman formula and 2.5-inch friction coefficient

**Setup:**
```yaml
Supply:
  Type: Adequate (no constraint)
  Intake Pressure: 60 PSI (maintained)

Discharge Line:
  Type: 2.5-inch attack line
  Length: 200 feet

Nozzle:
  Type: Smooth bore
  Diameter: 1.5 inches
  Target Pressure: 50 PSI
```

**Expected Results:**

1. **Nozzle Flow (Freeman Formula):**
   ```
   Q = 29.7 × d² × √NP
   Q = 29.7 × (1.5)² × √50
   Q = 29.7 × 2.25 × 7.071
   Q ≈ 472 GPM
   ```
   **Tolerance:** ±5 GPM (±1%)

2. **Friction Loss:**
   ```
   FL = 2.0 × (472/100)² × (200/100)
   FL = 2.0 × 22.3 × 2
   FL ≈ 89.2 PSI
   ```
   **Tolerance:** ±2 PSI

3. **Required PDP:**
   ```
   PDP = NP + FL
   PDP = 50 + 89.2
   PDP ≈ 139 PSI
   ```
   **Tolerance:** ±2 PSI

**Test Implementation:** [`tests/calcEngineV2.test.ts`](../../tests/calcEngineV2.test.ts) - "attack line with smooth bore"

---

### Scenario 3: Pump Performance Curve Validation

**Purpose:** Validate NFPA 1901 pump curve compliance

**Setup:**
```yaml
Apparatus Pump:
  Rating: 1500 GPM @ 150 PSI
  Standard: NFPA 1901

Test Points:
  - 50% flow (750 GPM)
  - 100% flow (1500 GPM)
  - 150% flow (2250 GPM)
```

**Expected Results:**

| Flow (GPM) | % of Rating | Expected Pressure (PSI) | Tolerance |
|------------|-------------|------------------------|-----------|
| 750 | 50% | 165 (110% of 150) | ±2 PSI |
| 1500 | 100% | 150 (100% of 150) | ±2 PSI |
| 2250 | 150% | 97.5 (65% of 150) | ±2 PSI |

**Rationale:** 
- At lower flows, centrifugal pumps produce higher pressures
- At rated flow, pump produces rated pressure (by definition)
- At high flows, pressure decreases due to pump physics
- This curve shape prevents over-pressure and protects equipment

**Test Implementation:** [`tests/calcEngineV2.test.ts`](../../tests/calcEngineV2.test.ts) - "pump performance curve"

---

### Scenario 4: Double-Tap Configuration

**Purpose:** Validate parallel flow distribution and the "70% more flow" rule

**Setup:**
```yaml
Hydrant:
  Static Pressure: 60 PSI
  Available Flow: High capacity

Supply Lines:
  Configuration: Two parallel 5-inch lines (double-tap)
  Length: 100 feet each
  Connection: Both to same intake

Total Demand:
  Flow: 1000 GPM total
```

**Expected Results:**

1. **Flow Distribution:**
   ```
   Each line ≈ 500 GPM (equal split for identical lines)
   ```
   **Tolerance:** ±10 GPM per line

2. **Friction Loss Per Line:**
   ```
   FL = 0.025 × (500/100)² × (100/100)
   FL = 0.625 PSI per line
   ```
   **Tolerance:** ±0.1 PSI

3. **Combined Intake Pressure:**
   ```
   Intake = Static - FL
   Intake = 60 - 0.625
   Intake ≈ 59.4 PSI
   ```
   **Tolerance:** ±1 PSI

4. **Capacity Validation (√2 Rule):**
   ```
   Single line capacity @ 5 PSI loss: ~700 GPM
   Double line capacity: ~700 × √2 ≈ 990 GPM
   Approximately 41% increase (often cited as "70% more")
   ```
   **Tolerance:** ±5%

**Test Implementation:** [`tests/hydraulics.test.ts`](../../tests/hydraulics.test.ts) - "parallel supply lines"

---

### Scenario 5: Complex Multi-Line Operation

**Purpose:** Validate full system integration with multiple supplies and discharges

**Setup:**
```yaml
Hydrant:
  Static: 55 PSI
  Test Flow: 750 GPM @ 45 PSI residual

Supply:
  Line 1: 5-inch × 200 feet
  Line 2: 5-inch × 150 feet
  Configuration: Parallel to intake

Discharges:
  Line 1: 2.5-inch × 200 feet → 1.5" smooth bore @ 50 PSI
  Line 2: 1.75-inch × 150 feet → fog nozzle @ 100 PSI
```

**Expected Behavior:**
1. Calculate hydrant available flow (NFPA 291)
2. Calculate required flows for each discharge
3. Distribute flow through supply lines based on resistance
4. Verify pump can meet discharge requirements
5. Check intake pressure remains > 20 PSI
6. Validate no cavitation warnings

**Test Implementation:** [`tests/panel.test.tsx`](../../tests/panel.test.tsx) - "complex evolution"

---

## Tolerance Specifications

### Acceptable Variances

Real-world fire service measurements have inherent variability. Our tolerances reflect realistic operational conditions:

| Measurement Type | Tolerance | Rationale |
|------------------|-----------|-----------|
| **Pressure** | ±1-2 PSI | Gauge accuracy typically ±1-2% of full scale |
| **Flow** | ±1-2% | Flowmeter accuracy specification |
| **Percentages** | ±0.5% | Calculation precision |
| **Friction Coefficients** | ±5% | Hose condition variability |
| **Pump Curves** | ±2 PSI | NFPA 1901 testing tolerance |

### Real-World Factors Affecting Measurements

1. **Gauge Precision:**
   - Analog gauges: ±2% full scale typical
   - Digital gauges: ±1% full scale typical
   - Bourdon tube hysteresis effects

2. **Flowmeter Accuracy:**
   - Paddlewheel: ±1-2%
   - Positive displacement: ±0.5-1%
   - Pitot tube: ±2-5%

3. **Environmental Factors:**
   - Water temperature affects viscosity
   - Elevation affects atmospheric pressure
   - Hose temperature affects friction

4. **Equipment Condition:**
   - New vs. aged hose (friction varies)
   - Coupling condition and type
   - Strainer/valve obstruction

**Testing Approach:** Use mid-range tolerances that account for typical field conditions without being overly conservative.

---

## Regression Testing

### Pre-Deployment Checks

**Complete Test Suite:**
```bash
cd puc-sim-manual-ui
npm test
```

**Expected Result:** 100% pass rate

**Current Status:** 99/99 tests passing (as of latest version)

**Critical Checks:**
1. ✅ All unit tests pass
2. ✅ All integration tests pass
3. ✅ No TypeScript compilation errors
4. ✅ Build completes successfully
5. ✅ No console errors in development mode

### TypeScript Compilation Check

```bash
npx tsc --noEmit
```

**Purpose:** Catch type errors before runtime

**Expected Result:** No errors, clean exit

### Build Verification

```bash
npm run build
```

**Purpose:** Ensure production build succeeds

**Expected Result:** Build artifacts created in `dist/` directory

---

### Feature Flag Testing

The simulator uses feature flags to enable new features. Each flag must be tested independently:

**Feature Flags:**
- `VITE_CALC_ENGINE_V2` - New calculation engine
- `VITE_HYDRANT_LAB_V2` - Enhanced Hydrant Lab UI
- `VITE_MOBILE_APP_UI` - Mobile-optimized interface

**Test Matrix:**

| Calc Engine V2 | Hydrant Lab V2 | Mobile UI | Expected Behavior |
|---------------|----------------|-----------|-------------------|
| OFF | OFF | OFF | Full legacy mode |
| ON | OFF | OFF | V2 calcs, legacy UI |
| ON | ON | OFF | Full V2 features |
| ON | ON | ON | Mobile-optimized V2 |
| OFF | ON | OFF | Legacy calcs, V2 UI (not recommended) |

**Testing Procedure:**
1. Set environment variables or URL flags
2. Run test suite for each configuration
3. Verify expected behavior
4. Document any configuration-specific issues

**URL Flag Override:**
```
http://localhost:5173/?flag:calc_engine_v2=1&flag:hydrant_lab_v2=1
```

**Expectation:** Legacy behavior remains unchanged when flags are OFF (backward compatibility).

---

## Reproduction Steps

### Running Tests Locally

**Full Test Suite:**
```bash
cd puc-sim-manual-ui
npm install
npm test
```

**Watch Mode (for development):**
```bash
npm test -- --watch
```

### Testing Specific Scenarios

**Specific Test File:**
```bash
npm test -- calcEngineV2.test.ts
npm test -- hydraulics.test.ts
npm test -- hydrant.test.tsx
npm test -- panel.test.tsx
```

**Specific Test Case:**
```bash
npm test -- -t "friction loss calculation"
npm test -- -t "NFPA 291 flow testing"
```

**With Coverage:**
```bash
npm test -- --coverage
```

### Manual Verification

**For visual/functional testing:**

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Load Simulator:**
   ```
   http://localhost:5173
   ```

3. **Enable Feature Flags (optional):**
   ```
   http://localhost:5173/?flag:calc_engine_v2=1
   ```

4. **Set Up Golden Scenario:**
   - Configure hydrant parameters
   - Add supply lines
   - Add discharge lines
   - Set nozzles

5. **Compare Results:**
   - Check displayed pressures
   - Verify flow calculations
   - Validate warnings/alerts
   - Compare to expected values from scenarios

6. **Document Deviations:**
   - Any variance > 2% should be investigated
   - Screenshot anomalies
   - Note exact configuration for reproduction

---

## Comparison Testing (V1 vs V2)

### Dual-Run Methodology

**Purpose:** Validate that Calc Engine V2 improves upon V1 while maintaining core accuracy

**Process:**

1. **Configure Identical Scenario:**
   - Same hydrant parameters
   - Same supply configuration
   - Same discharge demands

2. **Run Both Engines:**
   - V1: Legacy calculations
   - V2: New functional engine

3. **Compare Outputs:**
   ```
   Compare:
   - Intake pressure
   - Discharge pressures
   - Individual line flows
   - Warning/alert states
   - Pump performance
   ```

4. **Log Divergences:**
   - Document any differences > 2%
   - Classify as expected vs. unexpected
   - Investigate root causes

5. **Validate Against Standards:**
   - Which result is more accurate?
   - Which aligns better with NFPA formulas?
   - Which matches field testing?

### Known Expected Differences

| Aspect | V1 Behavior | V2 Behavior | Reason |
|--------|-------------|-------------|--------|
| **5-inch Friction** | Higher (0.08) | Lower (0.025) | Field calibration |
| **20-PSI Enforcement** | Relaxed | Strict | NFPA 291 compliance |
| **Pump Curves** | Linear interpolation | Quadratic interpolation | More realistic |
| **Parallel Flow** | Simplified | Physics-based | Accurate resistance calc |

**Testing Status:** Automated comparison testing is a planned enhancement (not yet implemented).

---

## Continuous Integration

### GitHub Actions Workflow

**File:** [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)

**Triggers:**
- Push to `main` branch
- Pull request to `main`
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Setup Node.js environment
3. Install dependencies (`npm ci`)
4. Run linting (`npm run lint`)
5. **Execute full test suite** (`npm test`)
6. **Check TypeScript compilation** (`npx tsc --noEmit`)
7. **Build production bundle** (`npm run build`)
8. Deploy to GitHub Pages (if main branch)

**Success Criteria:**
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Clean build
- ✅ No linting violations

**Failure Handling:**
- PR cannot merge if CI fails
- Notifications sent to developers
- Build logs available for debugging

---

## Field Validation

### Real-World Comparison Process

**Purpose:** Validate simulator against actual fire apparatus operations

**Methodology:**

1. **Record Field Test Data:**
   ```yaml
   Record:
   - Hydrant static pressure
   - Hydrant flow test results (GPM @ residual PSI)
   - Supply line configuration (diameter, length)
   - Pump intake pressure (during operations)
   - Pump discharge pressure
   - Discharge line flow (GPM)
   - Nozzle pressure (if measured)
   ```

2. **Input to Simulator:**
   - Configure identical scenario
   - Match all parameters exactly
   - Use same equipment specifications

3. **Compare Outputs:**
   ```
   Compare:
   - Calculated intake pressure vs. actual
   - Calculated discharge pressure vs. actual
   - Calculated flow vs. actual
   - Friction losses (if measurable)
   ```

4. **Analyze Divergence:**
   ```
   If divergence > 5%:
   - Check data entry accuracy
   - Verify equipment specifications
   - Consider environmental factors
   - Evaluate friction coefficients
   - Adjust simulator if systematic error found
   ```

5. **Document Results:**
   - Create field validation report
   - Include photos, measurements
   - Note any anomalies or insights
   - Archive for future reference

### Calibration History

**2022 Field Calibration:**
- **Event:** Department pump training
- **Apparatus:** Engine 1 (1500 GPM pump)
- **Hose:** Modern 5-inch LDH (3 years old)
- **Result:** Measured friction coefficient: 0.027
- **Decision:** Use 0.025 as conservative value

**2023 Pump Curve Validation:**
- **Event:** Annual pump testing
- **Apparatus:** Arrow XT pump
- **Result:** Exceeded NFPA 1901 minimums
- **Validation:** Simulator curves match actual within ±3 PSI

**Ongoing:** Continuous validation through training exercises

---

## Bug Reporting & Fixes

### When to File a Bug

**Critical Issues:**
- ❌ Any test failure (unit or integration)
- ❌ Divergence from NFPA standards > 5%
- ❌ Incorrect formula implementation
- ❌ Real-world comparison fails > 10%
- ❌ Crashes or errors during normal use

**Enhancement Requests:**
- 💡 Improved accuracy (< 5% divergence)
- 💡 Additional features
- 💡 Better user experience
- 💡 Documentation improvements

### Bug Report Template

```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [And so on...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Test Case
[Specific scenario that fails]

## Environment
- Calc Engine Version: [V1/V2]
- Feature Flags: [List active flags]
- Browser: [Browser and version]

## Additional Context
[Screenshots, error messages, etc.]
```

### Fix Verification Process

1. **Add Regression Test:**
   ```typescript
   // tests/bugfix.test.ts
   it('should fix issue #123', () => {
     // Test that reproduces the bug
     // Verify the fix
   });
   ```

2. **Apply Fix to Code:**
   - Make minimal necessary changes
   - Follow coding standards
   - Add comments explaining the fix

3. **Verify Test Passes:**
   ```bash
   npm test -- bugfix.test.ts
   ```

4. **Run Full Suite:**
   ```bash
   npm test
   ```
   - Ensure no regressions introduced
   - All tests must still pass

5. **Document Fix:**
   ```
   Commit message format:
   fix(hydraulics): correct friction loss calculation for parallel lines

   Fixes #123

   - Adjusted resistance calculation
   - Added test case
   - Updated documentation
   ```

6. **Update Documentation:**
   - If formula changed, update [`assumptions.md`](./assumptions.md)
   - If test added, update this file
   - Note in CHANGELOG

---

## Version History

### v2.0 - Calc Engine V2 Testing Suite
- Added comprehensive unit tests for V2 engine
- Implemented golden scenario validation
- Enhanced tolerance specifications
- Added parallel flow testing
- Field validation framework

### v1.0 - Initial Test Suite
- Basic unit tests for legacy engine
- Integration tests for UI components
- Simple scenario validation

---

## Future Testing Plans

### Planned Enhancements

1. **Property-Based Testing (QuickCheck Style)**
   - Generate random valid scenarios
   - Verify invariants always hold
   - Discover edge cases automatically

2. **Fuzz Testing**
   - Random input generation
   - Boundary condition exploration
   - Robustness validation

3. **Load Testing**
   - Performance benchmarking
   - Memory leak detection
   - Rendering performance
   - Large scenario handling

4. **Automated V1 vs V2 Comparison**
   - Systematic comparison testing
   - Divergence logging and analysis
   - Regression detection

5. **Visual Regression Testing**
   - Screenshot comparison
   - Layout verification
   - Cross-browser testing

6. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - WCAG compliance

---

## Test Maintenance Guidelines

### Regular Review Schedule

- **Weekly:** Check CI/CD pipeline status
- **Monthly:** Review test coverage reports
- **Quarterly:** Validate against latest NFPA standards
- **Annually:** Field validation with actual apparatus

### Adding New Tests

**When adding features:**
1. Write tests FIRST (TDD approach)
2. Ensure tests fail before implementation
3. Implement feature
4. Verify tests pass
5. Add to golden scenarios if applicable

**Test Quality Criteria:**
- ✅ Clear, descriptive names
- ✅ Single responsibility per test
- ✅ Independent (no test interdependencies)
- ✅ Repeatable (same result every time)
- ✅ Fast execution
- ✅ Well-documented with comments

---

## Conclusion

Comprehensive testing ensures the Fire Pump Simulator remains accurate, reliable, and aligned with fire service standards. This multi-layered approach—from unit tests to field validation—provides confidence in the simulator's calculations and educational value.

**Key Takeaways:**
- Test coverage is comprehensive (unit + integration)
- Golden scenarios provide regression benchmarks
- Tolerances reflect real-world measurement limits
- Continuous integration catches issues early
- Field validation maintains real-world accuracy

---

## Document Maintenance

**Last Updated:** 2024-10-27

**Maintained By:** Fire Pump Simulator Development Team

**Review Schedule:** Quarterly or with major version updates

**Feedback:** Report testing issues or suggestions via GitHub issues

---

*Quality through testing. Training through accuracy. Excellence through validation.*