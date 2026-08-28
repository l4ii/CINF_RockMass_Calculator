# RockMass Calculator Code Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the frontend's repeated integration and page code while preserving all calculator behavior.

**Architecture:** Keep calculation and persistence modules stable. Add small typed helpers and focused UI sections at the existing component boundary; the page components remain the state owners and pass explicit props to sections.

**Tech Stack:** React 18, TypeScript, Vitest, Vite, Electron preload APIs.

---

### Task 1: Establish typed Electron bridge access

**Files:**
- Create: `frontend/src/types/electronApi.ts`
- Modify: `frontend/src/vite-env.d.ts`
- Modify: `frontend/src/components/shell/SettingsPage.tsx`
- Test: `frontend/src/utils/__tests__/electronApi.test.ts`

- [ ] Add a typed `ElectronAPI` declaration covering only update, license, and deploy methods used by SettingsPage.
- [ ] Add a small `getElectronApi()` helper returning `window.electronAPI` or `null` in browser tests.
- [ ] Write tests for browser absence and update capability detection; run them and observe failure before implementation.
- [ ] Replace all SettingsPage `(window as any)` accesses with the typed helper and `unknown` error normalization.
- [ ] Run the focused test and typecheck.

### Task 2: Extract SettingsPage appearance and update sections

**Files:**
- Create: `frontend/src/components/shell/settings/SettingsAppearanceSection.tsx`
- Create: `frontend/src/components/shell/settings/SettingsUpdateSection.tsx`
- Modify: `frontend/src/components/shell/SettingsPage.tsx`
- Test: `frontend/src/components/shell/__tests__/SettingsSections.test.tsx`

- [ ] Add rendering tests for language/theme/scale controls and update status actions.
- [ ] Move appearance controls into a focused presentational component with explicit props.
- [ ] Move feedback/update controls into a focused component with callbacks and status props.
- [ ] Keep SettingsPage responsible for side effects and state only; preserve labels and update lifecycle.
- [ ] Run focused tests and typecheck.

### Task 3: Extract SettingsPage license and assistant sections

**Files:**
- Create: `frontend/src/components/shell/settings/SettingsLicenseSection.tsx`
- Create: `frontend/src/components/shell/settings/SettingsAssistantSection.tsx`
- Modify: `frontend/src/components/shell/SettingsPage.tsx`
- Test: `frontend/src/components/shell/__tests__/SettingsSections.test.tsx`

- [ ] Add tests for license visibility, copy/activation controls, and assistant status fallback.
- [ ] Move license and assistant/package UI into focused components.
- [ ] Preserve clipboard, activation, and status behavior through callback props.
- [ ] Run focused tests and typecheck.

### Task 4: Split AboutPage static content from layout

**Files:**
- Create: `frontend/src/components/shell/about/aboutSections.ts`
- Create: `frontend/src/components/shell/about/AboutSection.tsx`
- Modify: `frontend/src/components/shell/AboutPage.tsx`
- Test: `frontend/src/components/shell/__tests__/AboutDesignPrimitives.test.tsx`

- [ ] Identify repeated static section metadata and add a typed section model.
- [ ] Add one rendering test proving section metadata maps to the same visible headings/content.
- [ ] Replace repeated markup with the smallest reusable `AboutSection` component; leave image-specific layouts intact.
- [ ] Run focused tests and typecheck.

### Task 5: Remove confirmed low-value complexity and verify performance-sensitive paths

**Files:**
- Modify: `frontend/src/components/AssistantPanel.tsx`
- Modify: `frontend/src/components/classification/ClassificationSummaryPage.tsx`
- Modify: `frontend/src/components/rmr/RmrClassificationPage.tsx`
- Modify: only additional files identified by focused static search

- [ ] Remove memoization around trivial primitive/string derivations where it adds more code than work saved.
- [ ] Keep memoization for score/table construction and large list filtering.
- [ ] Remove unused imports/exports found by TypeScript or focused search.
- [ ] Run all frontend tests, typecheck, and production build.

### Task 6: Final verification and review

**Files:**
- No new source files.

- [ ] Run `npm run typecheck --prefix frontend`.
- [ ] Run `npm run test --prefix frontend`.
- [ ] Run `npm run build`.
- [ ] Re-scan for `as any` and unused-looking integration duplication in modified files.
- [ ] Report exact commands and results, including any pre-existing failures.
