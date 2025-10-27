Fire Pump Simulator – Comprehensive Audit & Enhancement Plan

In this audit, we examine the Fire Pump Simulator codebase and outline a plan to implement key enhancements. Each section below addresses one focus area with findings and proposed changes, while preserving current desktop behavior behind feature flags. All new logic will be gated by VITE_* flags (via import.meta.env) and covered by tests and documentation. The work will be split into separate PRs per domain (flags, calc engine, hydrant lab, mobile UI, docs) for clarity.
1. Architecture & Dependency Mapping

Module Graph & Dependencies: We will generate an AST-level import graph mapping all modules (especially by feature: e.g. hydrant-lab, mobile, state). This will visualize how components depend on each other (e.g. store ↔ math, UI ↔ store). For example, the Hydrant Lab feature’s store imports its solver (solveHydrantSystem) from a math module
GitHub
, and the UI components import the store for state via Zustand
GitHub
. We will use a static analysis tool (or custom AST parse) to produce reports/arch/dep-graph.md with diagrams of module relationships, plus reports/arch/metrics.json containing counts of components, lines, and complexity.

Dead Code & Cyclic Dependencies: The dependency analysis will flag any dead code (modules or exports never imported) and any cyclic imports. Initial review shows some duplication that likely can be cleaned up – for instance, friction loss constants appear in multiple places (global evoMath.ts and hydrant lab math)
GitHub
GitHub
. We will remove or consolidate such redundancy. So far, no blatant cyclic imports have been observed (e.g. core logic modules don’t import back from UI), but the import graph will confirm this. Any circular references will be refactored (e.g. by introducing intermediate modules or context injection) to improve maintainability.

Rendering & State Management Efficiency: The app uses React with Zustand state stores
GitHub
. We’ll audit component rendering patterns for inefficiencies. For example, in HydrantLabScreen, the component subscribes to the entire store state (useHydrantLab() with no selector)
GitHub
– meaning any state change triggers a re-render of the whole lab screen. This may be unnecessary overhead. We should encourage selective state selection (e.g. useHydrantLab(s => s.engineIntakePsi)) or React.memo where appropriate, to avoid re-renders of unrelated parts. We’ll quantify render counts in the metrics report. Where possible, we will refactor components to use narrower Zustand selectors or pass needed state as props, thereby reducing needless renders.
2. Hydraulics Audit (GPM, Nozzle Flow, FL, Pressures, PDP)

We audited the simulator’s hydraulic formulas and compared them against fire service standards from the provided references. Below is a breakdown of each calculation, current implementation vs. standard, and any discrepancies:

    Hydrant Flow (Total GPM): The simulator caps hydrant output with an empirical formula: MaxGPM=KΔP,MaxGPM=KΔP

​, with $K≈348$ for a 5.25″ main valve
GitHub
. At 80 psi static (60 psi drop to 20 residual), this gives ~2700 GPM max. This aligns with NFPA 291 guidance that flow ratings are measured with a 20 psi residual in the water main. The Heavy Hydrant research data (5″ at 50 psi yielding ~1290 GPM
GitHub
) suggests this K-value is reasonable. We will document this assumption and ensure it matches field data; any deviation (e.g. if actual hydrant curves suggest a slightly different coefficient) will be noted in the discrepancy matrix. The NFPA formula for available flow at 20 psi residual is also implemented (see availableFlowAtResidual using the 0.54 exponent
GitHub
), matching USFA guidelines
GitHub
.

Nozzle Flow Calculations: The code correctly uses the Freeman formula for smooth bore nozzles: Q=29.7×d2NP,Q=29.7×d2NP

    ​, where $d$ is tip diameter (inches) and $NP$ is nozzle pressure
    GitHub
    . This is consistent with standard texts
    GitHub
    . For example, a 1.5″ tip at 80 psi yields ~800 GPM, matching expectations. Fog nozzles are treated as constant flow at their rated GPM until pressure cannot be maintained
    GitHub
    . We will double-check these values against the Basic Pump Ops Manual and manufacturer data. Any mismatches (e.g. slight coefficient differences like using 29.83*C_d) will be noted, though the current approach appears correct per common practice
    GitHub
    . Nozzle reaction formulas are also in the docs (though not directly used in sim logic)
    GitHub
    .

    Friction Loss (FL) in Hose: The simulator uses the standard fire-service formula FL=C×(Q/100)2×(L/100)FL=C×(Q/100)2×(L/100)
    GitHub
    GitHub
    . Coefficients for attack lines and LDH match IFSTA/NFPA tables: e.g. 1¾″ hose $C=15.5$, 2½″ $C=2.0$, 5″ $C=0.08$
    GitHub
    GitHub
    . This matches the Basic Pump Manual and IFSTA data (the AI technical guide’s Table 3.2)
    GitHub
    . Discrepancy: We found another set of coefficients in the code (for supply lines) that differ – e.g. 5″ as 0.025 in hydraulics.ts
    GitHub
    . This lower value was calibrated to field tests (20–25 psi loss for 2000 GPM through 200′ of 5″
    GitHub
    ). The standard 0.08 may overestimate FL for modern hose; 0.025 seems to account for better hose or different formula units. We will reconcile this by normalizing these values in one place (see item 6) and documenting our chosen coefficients. Likely, we’ll adopt the field-calibrated coefficients for supply hose to match real performance, while still noting the standard values in the audit report.

    Residual vs. Intake Pressure: The code properly distinguishes hydrant residual (main) pressure vs engine intake pressure. The solver enforces a minimum hydrant main residual of 20 psi
    GitHub
    GitHub
    , as per NFPA 291’s 20-psi rule to protect water mains. The engine intake (pump intake) is allowed to fall below 20 (even near 0) as flow increases, which is acceptable so long as the hydrant’s main stays ≥20 psi. This behavior is explicitly noted in the docs: the 20-psi rule applies to the water main, not the intake gauge
    GitHub
    . The simulator’s advisor even warns when intake is low but main is OK (risking cavitation but not system pressure collapse)
    GitHub
    . We will validate the solver’s approach: it iteratively balances flows to maintain main residual ≥20
    GitHub
    , and this matches recommended practice. No major changes needed, though we will document this distinction clearly in docs/hydraulics/audit.md and ensure the 20 psi rule is always honored in the calc engine.

    Pump Discharge Pressure (PDP) and Pump Limits: The Pump Discharge Pressure is essentially the sum of nozzle pressure plus all losses (hose friction, appliance, elevation) in each line
    GitHub
    GitHub
    . The sim calculates required PDP per line accordingly
    GitHub
    , and in reverse, given a set PDP it computes actual flows delivered
    GitHub
    GitHub
    . This aligns with standard pump calculations (PDP = NP + FL + Appliance + Elevation). The governor/pump capacity limits are also modeled: the code uses a 1500 GPM @ 150 psi base, dropping to ~1050 at 200 psi and 750 at 250 psi
    GitHub
    – exactly matching NFPA 1901 pump performance curves (100%, 70%, 50% of rated flow at 150/200/250 psi). When demand exceeds this, governorLimited is flagged and flow is throttled
    GitHub
    GitHub
    . Cavitation: The code marks cavitation risk if intake pressure falls below 5–15 psi depending on PDP
    GitHub
    . This is a reasonable proxy for NPSH requirements – e.g. at very high PDP (>200) they require ≥15 psi intake. We will cross-check this with the Arrow XT pump manual and the DE Manual; typically keeping intake >0 is advised, with 5 psi often cited as minimum to avoid cavitation. The current thresholds (5/10/15) seem to add a safety margin at higher pump pressures, which we’ll document as an assumption. Overall, the PDP and pump-limited flow logic appear correct and are supported by both NFPA standards and the operator’s manual data. We will include a matrix of expected vs. simulated outputs for various scenarios (e.g. high-flow with one vs. two supply lines, etc.) to highlight any slight deviations. So far, calculations match known references well, aside from minor coefficient tuning.

All these findings will be compiled into reports/hydraulics/audit.md with a discrepancy matrix. Each formula will be re-derived from first principles and compared to the code, with explicit notes on assumptions (e.g. the fixed 10 psi appliance loss per discharge line in code
GitHub
vs. more detailed appliance losses in manuals – we’ll note that 10 psi is a simplification representing a typical wye or minor appliances).
3. Create CALC_ENGINE_V2

We will develop a new Calculation Engine v2 that encapsulates all hydraulic math in pure, deterministic functions. The goal is to make the core calculations more maintainable and testable, without side effects, and to correct any issues found in the audit. Key steps:

    Pure Functions for Hydraulics: We’ll isolate logic like hydrant flow distribution, friction loss, nozzle flow, and pump output into a set of standalone functions (e.g. calcHydrantFlow(...), calcNozzleFlow(...), calcFrictionLoss(...), solveIntakePressure(...), etc.). These will reside in a new module (e.g. src/engine/calcEngineV2.ts) separate from React or Zustand. For example, the current recompute() in the hydrant lab store calls solveHydrantSystem and computeDischarges internally
    GitHub
    – those computations will be refactored into independent functions that take a state snapshot as input and return calculated results, without relying on closure or mutating the store. This makes them easy to unit-test. We will ensure these functions produce identical or improved results compared to the legacy logic. Any adjustments (like using updated friction coefficients or more precise math) will be feature-flagged (see below).

    Unit Tests & Property Tests: We’ll add thorough tests under tests/hydraulics/ for every new function. This includes unit tests for known scenarios (e.g. a single 5″ line at 50 psi static should yield ~1290 GPM
    GitHub
    , which we can assert against our function) and property-based tests (e.g. increasing hose length should not increase GPM, etc., to catch regressions). We will also leverage the reference documents for test cases: for instance, use the USFA formula to verify our available flow calculations, or the pump curve to ensure we throttle correctly. The new CALC_ENGINE_V2 functions will be purely deterministic, meaning given the same inputs (hose setup, static pressure, PDP, etc.), they return the same outputs every time, which greatly simplifies testing compared to triggering the whole store loop.

    Feature Flag & Dual-Run Comparison: All new calculations will be guarded by a build-time flag VITE_CALC_ENGINE_V2. When this flag is true, the app will use the new calc engine; if false, it falls back to the current logic. To build confidence in V2, we’ll implement a dual-run comparator in a QA/debug screen: essentially, run both engines side by side and display their outputs for given inputs. This could be an internal “A/B Compare” developer page (the HydrantLab UI already has an “A/B Compare” button placeholder
    GitHub
    ). With the flag on, we can show differences between the old and new calculations in real time to verify parity. During development, we might log any significant divergence if it occurs. The comparator will not be exposed to end-users in production (or it will be a dev-only route).

    Refinement of Calculations: In developing Calc Engine V2, we’ll incorporate fixes from the audit. For example, we might adjust how appliance pressure loss is applied per line (the current fixed 10 psi might become configurable per device type), or use the refined friction coefficients consistently. We’ll ensure V2 matches established formulas – e.g. confirming that calcNozzleFlow for a smooth bore uses 29.7 coefficient and not a hardcoded flow curve. All these changes will be documented in docs/hydraulics/assumptions.md (see item 7). Because V2 is behind a flag, we can safely ship it and test extensively without impacting users until we are confident.

In summary, Calc Engine V2 will make the simulator’s core math reliable and transparent, with full test coverage. The dual-run under VITE_CALC_ENGINE_V2 will help us QA the results against the legacy engine and real-world expectations before eventually switching it on by default.
4. Hydrant Lab V2 (UI & Logic)

We will enhance the Hydrant Connection Lab experience by merging it with the troubleshooting functionality and improving the UI and logic, all behind a new flag VITE_HYDRANT_LAB_V2. The plan:

    Merge Lab and Troubleshooting: Currently, the “Hydrant Lab” mode (for practicing hydrant hookups) already includes some troubleshooting guidance (per its description, it “includes troubleshooting scenarios”
    GitHub
    ). We will fully integrate any separate troubleshooting tab or features into the main Hydrant Lab interface. This likely means if there were separate UI panels or steps for troubleshooting (like diagnosing low intake pressure, etc.), they will become part of the unified lab UI. The advisor system already provides tips (e.g. warnings for low residual or using 3″ hose
    GitHub
    GitHub
    ); we’ll build on this to ensure the lab not only simulates but teaches by highlighting issues in real-time.

    SVG Hydrant Canvas & Hose Editor: A major UI enhancement is to add a visual hydrant graphic with interactive ports. We’ll implement an SVG-based hydrant diagram showing the steamer and side outlets. Users can attach or detach hoses by interacting with this graphic (e.g. clicking a port to add a line). The groundwork appears to be there – the code has HydrantCanvas and HosePaths components
    GitHub
    GitHub
    which likely draw the hydrant and hose lines. In V2, we’ll refine these: making the hose lengths and open/closed gates editable via the graphic (for example, dragging a hose to change its length, or tapping a gate valve icon to open/close a side port). This will provide a more intuitive “lab” feel. We’ll also incorporate a discharge flow bar – perhaps a visual bar or gauge indicating how much water is being discharged vs. available. This could be a simple horizontal bar showing total supply GPM vs used GPM, or individual bars per discharge line to illustrate how flow is split. Such a visualization will help users see the effect of adding a second supply line or closing a nozzle in real time.

    Advisor Chips & Guidance: The current AdvisorChips component provides excellent real-time tips (e.g. suggesting a double tap when only one line is connected, warning if residual <20 psi, noting when HAV boost is active, etc.)
    GitHub
    GitHub
    . We will ensure these advisor chips are prominent in the V2 UI, possibly with even more interactive guidance. For example, when a warning chip says “Residual below 20 psi – add another supply leg”, the user could tap the chip to automatically reveal a hint or perform an action (like highlight the side port to connect a hose). We’ll also add any missing tips such as reminding the 20-psi rule (though that is essentially covered by the residual warnings
    GitHub
    ) and highlighting the effect of the Hydrant Assist Valve (HAV). The code already has a chip for HAV boost mode
    GitHub
    . We might extend this: e.g. if HAV is present but not enabled and intake is low, suggest using HAV boost.

    HAV and Advanced Tactics: The Hydrant Lab V2 will also incorporate the Hydrant Assist Valve logic more seamlessly. We’ll allow users to toggle HAV in-line on the steamer and choose bypass vs. boost modes, with the visual showing the change (perhaps an icon on the steamer connection). The simulation already accounts for HAV losses or boost in the math
    GitHub
    GitHub
    ; V2 UI will make this a clear part of the lab (since HAV usage is a “troubleshooting” tactic for low intake scenarios).

    Legacy Preservation: All these UI changes will be wrapped such that if VITE_HYDRANT_LAB_V2 is off, the app will continue to show the current Hydrant Lab interface unchanged. We might implement this by routing – e.g. the hydrant lab route renders either HydrantLabScreenV2 or the old HydrantLabScreen depending on the flag. Alternatively, within the component we can conditionalize new elements. However, a cleaner approach is route-level separation, which leads to the next point.

    Route-Level Flag Wrapper: We will introduce a utility (see item 8) and use it so that the navigation launches the new lab under a different path or component. The ModeLauncher currently selects “Hydrant Lab” mode
    GitHub
    ; under the hood we can decide which component to load. This ensures we can iterate on the new UI without affecting the old one. We’ll maintain both until V2 is fully tested and accepted.

Hydrant Lab V2 will thus be a richer, more interactive training sandbox. It merges educational feedback with the simulator, guiding users on things like double tapping a hydrant (which the system will recognize and confirm
GitHub
), using larger diameter hose, and avoiding low intake pressure. All assumptions and the physics behind these tips will be documented in the new docs/hydraulics/assumptions.md (for example, why we suggest a second 5″ line at ~1000+ GPM, tying it to hydrant area ratios
GitHub
GitHub
).
5. Mobile App Shell UI Enhancements

We will continue building out the mobile-specific UI, which is behind the existing VITE_MOBILE_APP_UI feature flag
GitHub
. The goal is to provide an app-like experience on small screens without disrupting desktop UI. Key components to enhance:

    Situational Awareness HUD (SA-HUD): This top heads-up display shows critical info like tank/foam levels, intake/discharge pressures, and governor setting
    GitHub
    GitHub
    . We will finalize its design and behavior. The code indicates a dynamic height (collapsible header on scroll) and color-coded readouts for warnings (e.g. intake turns amber <20 psi)
    GitHub
    GitHub
    . We’ll test and polish this: ensure the collapse/expand works smoothly, the styling matches an “app” aesthetic, and all necessary info is present. We’ll also connect the HUD controls to the store – e.g. the governor bump buttons +/- 5 psi are already coded
    GitHub
    GitHub
    . We will verify they properly adjust the governor setpoint (via store actions). Essentially, we’ll make sure the SA-HUD is fully functional and responsive across different device sizes.

    Bottom Navigation: A persistent bottom nav bar will be implemented for easy mode switching and navigation on mobile. Many mobile apps use a bottom tab bar. We plan to include buttons for major modes like “Pump Panel”, “Hydrant Lab”, “Scenarios”, etc., using intuitive icons (some icons like gauge, droplet are already imported in ModeLauncher
    GitHub
    ). The bottom nav will only show when VITE_MOBILE_APP_UI is enabled (and likely when screen width is mobile). It will tie into the existing mode system: tapping a nav icon will trigger the same actions as selecting a mode in the launcher (we can reuse useLauncher state to switch modes
    GitHub
    ). This allows mobile users to switch between features with one tap, rather than going through the launcher each time.

    Quick-Toggles Sheet: We’ll finish the implementation of the slide-up Quick Toggles sheet
    GitHub
    . This sheet is meant to provide contextual quick toggles for the current mode. The code shows it can expand/collapse and chooses content based on the active mode (route)
    GitHub
    GitHub
    . We need to populate getTiles(route) with actual toggle buttons or controls. For instance, on the Pump Panel mode, toggles might include “Engage Pump”, “Throttle Up/Down”, etc. On Hydrant Lab, toggles might include quick switches for hydrant static pressure presets or to enable HAV. We will design these toggles in collaboration with the features – likely using existing actions in the store. The Quick-Toggles sheet should act as a handy toolbox for the user, without needing to navigate through menus. We’ll ensure it’s sized appropriately (as per code, about 60% height when open
    GitHub
    ) and that it doesn’t interfere with the keyboard or gestures (code already accounts for keyboard open to adjust position
    GitHub
    ).

Overall, the mobile UI enhancements will make the simulator feel like a cohesive app. All new UI elements will be conditionally rendered only when VITE_MOBILE_APP_UI is true, so desktop web remains unchanged. We’ll test on various device emulators to fine-tune touch areas, font sizes, etc., for usability. The mobile shell’s state (e.g. collapsed HUD or open toggles) will be managed in Zustand or React state as needed, and we’ll add any new state fields behind the feature flag to avoid impacting desktop state logic.
6. Normalize Coefficients & Appliance Data

Currently, various hydraulic constants (hose friction coefficients, nozzle definitions, appliance pressure losses, etc.) are hard-coded in the TypeScript. We will externalize these into JSON data files in a new /data directory for easier maintenance and clarity:

    Friction Coefficients: We will create a JSON file (e.g. data/friction_coeffs.json) listing coefficients for each hose diameter (for both supply and discharge hose types). For example, entries for 1.75″, 2.5″, 3″, 4″, 5″ and possibly separate sets for “attack” vs “supply” if needed. This lets us clearly document which values we use (the field-calibrated vs standard, or perhaps we include both and tag them). The code will then import these at runtime or build-time. This means instead of scattered constants like C_5IN = 0.08 in one file
    GitHub
    and 0.025 in another
    GitHub
    , there will be a single source of truth. If, for example, we want to adjust 5″ hose to 0.05 in the future, it’s one edit in JSON rather than searching code.

    Nozzle & Appliance Specs: The NOZZLE_LIBRARY currently in code defines nozzle types (smooth bore, fog, etc.) with their pressures and flows
    GitHub
    GitHub
    . We will move these definitions to data/nozzles.json. Similarly, appliance losses (gated wye, standpipe, master stream appliance, etc.) can go to data/appliances.json – e.g. { "gate_valve": 2, "storz_adapter": 3, "HAV_bypass": 4, "wye_siamesed": 10, "master_stream_device": 25 } in psi loss, as documented in the AI guide
    GitHub
    . By having these in JSON, they are easier to review against source material and adjust without touching code. This also opens the door for future user customization (though not requested now, it’s a good practice).

    Hose Data: In some cases, rather than pure constants, we might have data structures – e.g. hose diameter vs area, or hydrant port sizes. These could also live in data files for completeness (the AI guide section 2.3 has a table of areas
    GitHub
    , but those are more educational than needed in code). At minimum, friction coefficients and appliance losses are prime candidates for data files.

    Using Data in Code: We’ll add a small utility to load these JSON files (with Vite, importing a JSON is straightforward). The store or calc engine functions will then reference the loaded object. For example, the friction loss function can do coeff = frictionData[diameter] instead of a hardcoded if/else. We’ll ensure type safety via TypeScript by defining interfaces for these data files. By normalizing this data, we ensure consistency (e.g. the evo scenario math and the hydrant lab will use the same coefficients from the same source, preventing divergence).

All these data files will be documented – we’ll provide references in comments or the docs as to where these numbers come from (e.g. “0.08 for 5″ is per IFSTA handbooks
GitHub
, 0.025 is per 2022 field tests
GitHub
, etc.). This transparency helps when auditing or updating values later. It also simplifies the future calibration: if field experience suggests tweaking a coefficient, it’s a data update, not a code change.
7. Documentation of Assumptions & Derivations

We will create a comprehensive documentation file at docs/hydraulics/assumptions.md capturing all key assumptions, formulas, and derivations used in the simulator. This serves as an engineering reference to justify the sim’s behavior. It will include:

    List of Formulas: A catalog of all hydraulic formulas used (e.g. friction loss equation, Freeman nozzle formula, NFPA 291 flow formula, elevation pressure, pump performance curve equations). For each, we will cite the source. For example, we’ll state the friction loss formula and cite IFSTA manual
    GitHub
    , nozzle flow formula with Task Force Tips reference
    GitHub
    , and the NFPA 291 residual formula with USFA citation
    GitHub
    .

    Assumptions & Simplifications: We will clearly list things like: assuming 20 psi residual main minimum (and that dropping intake below 20 is acceptable); assuming the pump behaves per NFPA 1901 curves (we may include the specific points 100%/70%/50% at 150/200/250 psi); using a fixed 10 psi allowance for minor appliance loss on each discharge (not individually simulating each fitting, which is a simplification); assuming friction loss coefficients as given (with maybe a note on the difference between textbook vs field values and why we chose one). We’ll also mention any safety margins (like the intake <5 psi cavitation warning threshold). Essentially, any time we had to make a design decision or approximation, it will be documented here.

    Hydraulic Derivations: Where needed, we’ll derive or explain the math. For example, we can derive the combined flow in parallel supply lines using the electrical analogy (which is implemented in the solver) – the doc can show a short derivation that total conductance is sum of individual, etc., to explain how the iterative solver finds equilibrium
    GitHub
    GitHub
    . We’ll also derive the Freeman formula briefly and perhaps the NFPA 291 0.54 exponent (explaining it’s an approximation of the 1.85 Hazen-Williams exponent). These derivations lend credibility and help future developers (or firefighters reading it) understand the “why” behind the code.

    Comparisons to Standard Practices: We will include brief notes on how the sim’s logic compares to traditional pump chart calculations. For instance, the lab doesn’t use the old “70% of available flow from second hydrant line” rule explicitly – instead it emerges from physics. We’ll clarify that in documentation for those familiar with rule-of-thumb methods. We will also ensure to mention that the 20-psi main rule is strictly enforced, since that’s a critical safety point often misunderstood (and our advisor chips already highlight it)
    GitHub
    .

By centralizing this info in assumptions.md, anyone can audit or update the simulator’s logic with a clear understanding of the underlying rationale. This doc will be referenced in code comments where appropriate (e.g. linking to a section if a particular formula’s justification is explained there). It will also be a useful reference for instructors using the simulator, to know that (for example) the reason their pump cavitates at a certain point in the sim is directly tied to real NFPA testing standards.
8. Feature Flags & Route-Level Wrappers

To manage the new features without disrupting existing functionality, we will add convenient mechanisms for feature-flagging at the route/component level:

    Centralized featureFlag() Helper: We will create a utility in src/flags.ts that wraps import.meta.env flag checks. For example, featureFlag('HYDRANT_LAB_V2') would read the environment variable VITE_HYDRANT_LAB_V2 (converting it to boolean). This helper can also implement overrides: e.g. if we want to allow enabling a flag via URL query (the .env.example suggests using ?m=1 to force mobile mode
    GitHub
    ), the helper could check the URL or local storage for an override. This way, all flag logic is in one place. By using featureFlag('MOBILE_APP_UI'), components need not know the env variable naming or query param details – the helper abstracts it.

    Route-Level Conditional Rendering: We will use the helper to load different components for certain routes based on flags. For instance, in the app’s router or mode launcher, when the user enters Hydrant Lab mode, we do something like: return featureFlag('HYDRANT_LAB_V2') ? <HydrantLabScreenV2/> : <HydrantLabScreen/>. Similarly for any new calc-engine QA page or mobile-specific layouts. This ensures we don’t mix V1 and V2 logic in the same component, reducing risk. For the Mobile UI, we might have an alternate app shell wrapped by a flag – possibly the app already checks the flag to decide whether to render mobile layout (the presence of mobile/ components suggests a parallel structure). We’ll verify how it’s currently toggled (perhaps via the ?m=1 param in the code). If needed, we’ll implement a high-level switch so that if mobile flag is on, we use MobileFrame or similar, else the standard desktop layout. The helper can assist here too.

    Consistency and Safety: By consolidating flags usage, we avoid mistakes where one part of the code checks import.meta.env.VITE_X and another uses a different approach. All new features (CalcEngineV2, HydrantLabV2, MobileUI, etc.) will be tied into this system. We will add unit tests for the featureFlag util (ensuring it correctly reads env and respects overrides). We’ll also include a section in assumptions.md or a separate short doc on feature toggles, describing how to enable them for testing (since testers might use the query param or set env in build).

Finally, we will verify that desktop behavior is identical with all new flags off. This means running the app with all VITE_* false and confirming UI and outputs haven’t changed at all from the current version (all tests should pass in legacy mode). Only when flags are true should the new behaviors appear. This strategy allows incremental integration and easy rollback if an issue is found – just flip the flag.

Conclusion & Next Steps: With this plan, we’ll improve the simulator’s robustness (via the new calc engine and normalized data), enhance its training value (Hydrant Lab V2 with richer guidance), and expand its accessibility (mobile UI). Each set of changes will be delivered in a focused pull request, with appropriate tests and documentation. By preserving existing functionality behind flags, we ensure a smooth transition. Once each enhancement is validated (e.g. through the dual-run comparisons and user testing of the new UI), the feature flags can ultimately be turned on for end-users. This audit-driven approach guarantees that the Fire Pump Simulator remains an accurate and effective training tool, grounded in real fire service hydraulics
GitHub
and improved by modern software practices. All findings and changes will be traceable via the linked reports and docs for future reference.