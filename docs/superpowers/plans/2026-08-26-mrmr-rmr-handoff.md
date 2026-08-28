# MRMR RMR Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an MRMR workspace that accepts a transparent RMR-derived prefill while preserving the independent MRMR workflow.

**Architecture:** Keep MRMR calculation and persistence in the existing generic adapter workflow. Add a pure RMR-to-MRMR mapper, pass a one-shot prefill through App/MainContent, and let ClassificationModule auto-create the initial MRMR case and point when a prefill exists. Keep unresolved MRMR-only fields explicit and editable.

**Tech Stack:** React 18, TypeScript, Vitest, existing generic classification adapters, Tailwind utility classes.

---

### Task 1: Define and test the RMR-to-MRMR mapping

**Files:**
- Modify: `frontend/src/methods/mrmr.ts`
- Test: `frontend/src/methods/__tests__/mrmr.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for a complete RMR form with numeric A1/A2/A3/A5 inputs. Assert that the mapper returns MRMR IRS, spacing in metres, a water condition, `source: 'rmr'`, and a list of inferred fields. Add a second test with missing numeric values that asserts score-based fallback values are returned and marked approximate.

- [ ] **Step 2: Run the focused tests and verify failure**

Run `npm --prefix frontend test -- --run src/methods/__tests__/mrmr.test.ts`.
Expected: FAIL because the mapper and payload types do not exist.

- [ ] **Step 3: Implement the minimal mapper**

Add `MrmrPrefill`, `MrmrPrefillSource`, and `buildMrmrPrefillFromRmr(state, pointMeta)` exports. Prefer numeric values, convert A3 cm to m, map A5 criteria to `MRMR_WATER_OPTIONS`, and use explicit normalized score fallbacks for missing numeric values. Return a normalized `MrmrFormState` plus `inferredFields` and source metadata; leave MRMR-only fields at safe defaults that validation can expose.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run the same Vitest command and confirm the new tests and existing MRMR tests pass.

### Task 2: Add the RMR result entry point

**Files:**
- Modify: `frontend/src/components/rmr/RmrResultPanel.tsx`
- Modify: `frontend/src/components/rmr/RmrClassificationPage.tsx`
- Modify: `frontend/src/components/rmr/RmrModule.tsx`
- Test: `frontend/src/components/rmr/__tests__/RmrI18n.test.tsx`

- [ ] **Step 1: Write the failing component test**

Render a complete RMR point and assert the MRMR button is visible. Trigger it and assert the callback receives the current RMR form and point metadata.

- [ ] **Step 2: Run the focused component test and verify failure**

Run `npm --prefix frontend test -- --run src/components/rmr/__tests__/RmrI18n.test.tsx`.
Expected: FAIL because no MRMR entry callback or button exists.

- [ ] **Step 3: Implement the entry point**

Add an optional `onEnterMrmr` prop to `RmrResultPanel` and `RmrClassificationPage`, render the button only for complete scores, and pass the active point form plus metadata from `RmrModule` to its existing `onNavigateToMethod` flow.

- [ ] **Step 4: Run the focused component test and verify it passes**

Run the same command and confirm the button and callback assertions pass without breaking existing RMR UI tests.

### Task 3: Thread a one-shot prefill into the generic MRMR module

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/MainContent.tsx`
- Modify: `frontend/src/components/classification/ClassificationModule.tsx`
- Modify: `frontend/src/components/rmr/RmrModule.tsx`
- Test: `frontend/src/components/classification/__tests__/ClassificationWorkflowI18n.test.tsx`

- [ ] **Step 1: Write the failing workflow test**

Render `ClassificationModule` for MRMR with a prefill and assert it opens directly on a created point whose form contains the RMR-derived IRS and spacing values. Render without a prefill and assert the normal MRMR workspace remains available.

- [ ] **Step 2: Run the focused workflow test and verify failure**

Run `npm --prefix frontend test -- --run src/components/classification/__tests__/ClassificationWorkflowI18n.test.tsx`.
Expected: FAIL because `ClassificationModule` has no prefill input and always starts at the workspace.

- [ ] **Step 3: Implement the handoff state**

Add an App-level `mrmrPrefill` state, a callback from `RmrModule` that builds and stores the payload before selecting MRMR, and a `prefill` prop on `MainContent`/`ClassificationModule`. On first mount with a prefill, create and persist a new MRMR case and point, set the active point, and clear the one-shot payload after consumption. Preserve the independent workflow when no prefill is provided.

- [ ] **Step 4: Run the focused workflow test and verify it passes**

Run the same command and confirm both handoff and independent workspace assertions pass.

### Task 4: Make MRMR provenance and inferred fields visible

**Files:**
- Modify: `frontend/src/components/classification/forms/MrmrMethodForm.tsx`
- Modify: `frontend/src/methods/adapters/mrmrAdapter.ts`
- Modify: `frontend/src/types/rockmassCase.ts`
- Test: `frontend/src/methods/__tests__/adapterWorkflow.test.ts`

- [ ] **Step 1: Write the failing presentation test**

Assert that an MRMR description includes the RMR source label and inferred-field note when the input contains handoff metadata, while a normal MRMR input does not show that note.

- [ ] **Step 2: Run the focused test and verify failure**

Run `npm --prefix frontend test -- --run src/methods/__tests__/adapterWorkflow.test.ts`.
Expected: FAIL because provenance is not part of the persisted form/description.

- [ ] **Step 3: Implement provenance display**

Persist optional handoff metadata in the MRMR input shape, show a compact source banner and inferred-field warning in `MrmrMethodForm`, and include the same provenance in adapter descriptions/reports without changing score calculation.

- [ ] **Step 4: Run focused tests and verify they pass**

Run the focused adapter test plus the MRMR tests.

### Task 5: Full verification

**Files:**
- No new production files.

- [ ] **Step 1: Run all frontend tests**

Run `npm --prefix frontend test -- --run` and confirm exit code 0 with no failed tests.

- [ ] **Step 2: Run TypeScript and production build checks**

Run `npm --prefix frontend run build` and confirm the production bundle completes successfully.

- [ ] **Step 3: Review the diff and report residual risk**

Inspect changed files for accidental unrelated edits. Report that RMR-to-MRMR field mappings are engineering approximations where the source methods do not share a one-to-one table entry, and that unresolved MRMR-only fields remain user-confirmed.
