# RMR Engineering Overview Ledger-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the RMR engineering overview a ledger-first workspace where the default A1-A6 score table appears before supporting charts and statistics.

**Architecture:** `RmrCaseSummaryPage` owns the page order, table accessibility markers and point-detail expansion. `RmrOverviewControls` becomes a compact filter toolbar, while `RmrOverviewCharts` remains a read-only presentation module placed after the table and exposes stable regions for chart and statistics assertions. Both table and charts continue to consume the same already-filtered, already-sorted rows.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, Testing Library, lucide-react.

---

## File Structure

- Modify: `frontend/src/components/rmr/RmrCaseSummaryPage.tsx`
  - Remove the duplicate top KPI cards, render the score ledger before analytics, retain default A1-A6 columns and add test identifiers for the table region.
- Modify: `frontend/src/components/rmr/RmrOverviewControls.tsx`
  - Render existing filter and sort controls as one compact toolbar without changing filter data or callbacks.
- Modify: `frontend/src/components/rmr/RmrOverviewCharts.tsx`
  - Keep the four read-only charts and lower statistics row, adding stable regions for the two blocks.
- Modify: `frontend/src/components/rmr/__tests__/RmrI18n.test.tsx`
  - Cover the page reading order, default score columns, absence of duplicate KPI cards and point-detail expansion.
- Modify: `frontend/src/components/rmr/__tests__/RmrOverviewControls.test.tsx`
  - Cover the toolbar semantics and the existing single reset action.
- Modify: `frontend/src/components/rmr/__tests__/RmrOverviewCharts.test.tsx`
  - Cover chart tooltips, visible chart/statistics regions and the absence of chart filtering controls.

## Task 1: Lock the Ledger-First Contract in Tests

**Files:**
- Modify: `frontend/src/components/rmr/__tests__/RmrI18n.test.tsx:383-427`
- Modify: `frontend/src/components/rmr/__tests__/RmrOverviewCharts.test.tsx:32-51`
- Modify: `frontend/src/components/rmr/__tests__/RmrOverviewControls.test.tsx:6-30`

- [ ] **Step 1: Write the failing overview order test**

  In the existing `keeps the project overview focused on point scores and ore type` test, add assertions after rendering:

  ```tsx
  const pointScores = screen.getByTestId('rmr-point-scores')
  const analysis = screen.getByTestId('rmr-overview-analysis')
  const statistics = screen.getByTestId('rmr-overview-statistics')

  expect(pointScores.compareDocumentPosition(analysis) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(analysis.compareDocumentPosition(statistics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.queryByText('点位总数')).not.toBeInTheDocument()
  expect(screen.getAllByRole('columnheader', { name: 'A1' }).length).toBeGreaterThan(0)
  ```

  Keep the existing check that the `实际输入` column is absent before the point-row arrow is clicked and present after it is clicked.

- [ ] **Step 2: Run the test to verify it fails**

  Run:

  ```powershell
  npm test -- --run src/components/rmr/__tests__/RmrI18n.test.tsx
  ```

  Expected: FAIL because `rmr-point-scores`, `rmr-overview-analysis` and `rmr-overview-statistics` do not yet exist, and the top `点位总数` KPI is still rendered.

- [ ] **Step 3: Write the chart and toolbar contract tests**

  In `RmrOverviewCharts.test.tsx`, add:

  ```tsx
  expect(screen.getByTestId('rmr-overview-analysis')).toBeInTheDocument()
  expect(screen.getByTestId('rmr-overview-statistics')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '清除图表筛选' })).not.toBeInTheDocument()
  ```

  In `RmrOverviewControls.test.tsx`, add:

  ```tsx
  expect(screen.getByTestId('rmr-overview-toolbar')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: '筛选与排序' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '清除筛选' })).toBeInTheDocument()
  ```

- [ ] **Step 4: Run the focused test suite to verify the new assertions fail**

  Run:

  ```powershell
  npm test -- --run src/components/rmr/__tests__/RmrI18n.test.tsx src/components/rmr/__tests__/RmrOverviewCharts.test.tsx src/components/rmr/__tests__/RmrOverviewControls.test.tsx
  ```

  Expected: FAIL only on the newly added test identifiers, top KPI absence and removed toolbar heading.

- [ ] **Step 5: Commit the test contract**

  Run:

  ```powershell
  git add frontend/src/components/rmr/__tests__/RmrI18n.test.tsx frontend/src/components/rmr/__tests__/RmrOverviewCharts.test.tsx frontend/src/components/rmr/__tests__/RmrOverviewControls.test.tsx
  git commit -m "test: define ledger-first RMR overview"
  ```

  Current workspace note: `git rev-parse --show-toplevel` returns `fatal: not a git repository`; record the command failure and continue without a commit rather than initializing a repository.

## Task 2: Place the Point Score Ledger Before Analytics

**Files:**
- Modify: `frontend/src/components/rmr/RmrCaseSummaryPage.tsx:71-122`
- Modify: `frontend/src/components/rmr/RmrCaseSummaryPage.tsx:154-306`

- [ ] **Step 1: Remove the duplicate overview KPI model**

  Delete the `metrics` constant and its `copy` fields: `totalPoints`, `mean`, `range`, `noResult`, and `distribution`. These values remain available in the lower statistics row rendered by `RmrOverviewCharts`.

- [ ] **Step 2: Render the score table immediately after the toolbar**

  Move the existing `<div className={cardCls}>` score-table block so that it directly follows `<RmrOverviewControls />`; wrap it as follows:

  ```tsx
  <section className={cardCls} data-testid="rmr-point-scores">
    <div className="mb-2 flex justify-end">
      <span className={`text-xs ${mutedText}`}>{sortedRows.length} {isEn ? 'points' : '个点位'}</span>
    </div>
  </section>
  ```

  Preserve the point-name navigation, the A1-A6 columns, the RMR and class cells, and the arrow-driven detail row. Do not reintroduce a global show/hide score switch.

- [ ] **Step 3: Make the score-table header stable while reading the ledger**

  Change the main-table header to:

  ```tsx
  <thead className={`sticky top-0 z-10 ${headCell}`}>
  ```

  Remove `${headCell}` from each main-table `<th>` because the header row owns the background and foreground colors. Keep the nested point-detail table header unchanged.

- [ ] **Step 4: Move charts after the ledger**

  Render the current chart component immediately after the score-table section:

  ```tsx
  <RmrOverviewCharts
    darkMode={darkMode}
    language={language}
    stats={stats}
    scatterKey={scatterKey}
    onScatterKeyChange={setScatterKey}
  />
  ```

  This order must be `RmrOverviewControls` → `rmr-point-scores` → `RmrOverviewCharts`.

- [ ] **Step 5: Update the note below the table**

  Replace the Chinese and English notes with text that only explains the row expansion, because the A1-A6 scores are already visible:

  ```tsx
  note: '点击点位名称进入 RMR 计算；点击末列箭头查看实际输入和工程参数。',
  ```

  ```tsx
  note: 'Click a point name to open its RMR calculation. Use the last-column arrow to view actual inputs and engineering parameters.',
  ```

- [ ] **Step 6: Run the overview integration test**

  Run:

  ```powershell
  npm test -- --run src/components/rmr/__tests__/RmrI18n.test.tsx
  ```

  Expected: PASS, including the assertion that the ledger precedes analytics, the top `点位总数` KPI is absent and A1-A6 remain visible by default.

- [ ] **Step 7: Commit the page layout change**

  Run:

  ```powershell
  git add frontend/src/components/rmr/RmrCaseSummaryPage.tsx frontend/src/components/rmr/__tests__/RmrI18n.test.tsx
  git commit -m "feat: prioritize RMR point score ledger"
  ```

  Current workspace note: Git is unavailable in this workspace; do not run `git init` as a substitute.

## Task 3: Turn Filtering into a Compact Toolbar

**Files:**
- Modify: `frontend/src/components/rmr/RmrOverviewControls.tsx:31-128`
- Modify: `frontend/src/components/rmr/__tests__/RmrOverviewControls.test.tsx:6-30`

- [ ] **Step 1: Replace the card heading with a toolbar container**

  Replace the outer section and heading block with:

  ```tsx
  <section
    data-testid="rmr-overview-toolbar"
    aria-label={label.filters}
    className={`flex flex-wrap items-end gap-2 border-y py-3 ${border}`}
  >
  </section>
  ```

  Keep `label.filters` for the accessible region name but remove the visible `<h2>` so the toolbar does not create a competing page section.

- [ ] **Step 2: Put the existing controls into the toolbar flow**

  Replace the current `grid grid-cols-1 ...` container with:

  ```tsx
  <div className="flex min-w-[10rem] flex-1 flex-wrap items-end gap-2">
  </div>
  ```

  Apply `w-36` to the ore-type input, RMR minimum and maximum inputs; `w-48` to the parameter select; and `w-40` to the sort select. Keep parameter minimum/maximum conditional on `filters.parameterKey`. Keep the clear button outside this inner `div` so it remains at the toolbar end.

- [ ] **Step 3: Preserve all event payloads**

  Do not change any existing `onFiltersChange` or `onSortChange` calls. In particular retain:

  ```tsx
  onChange={(event) => onFiltersChange({ oreTypeQuery: event.target.value, oreTypeMissingOnly: false })}
  ```

  and:

  ```tsx
  onClick={() => onSortChange(sortKey, sortDirection === 'asc' ? 'desc' : 'asc')}
  ```

- [ ] **Step 4: Run the toolbar test**

  Run:

  ```powershell
  npm test -- --run src/components/rmr/__tests__/RmrOverviewControls.test.tsx
  ```

  Expected: PASS. The ore-type change still sends the current filter patch, the only reset action remains `清除筛选`, and there is no visible `筛选与排序` heading.

- [ ] **Step 5: Commit the toolbar layout change**

  Run:

  ```powershell
  git add frontend/src/components/rmr/RmrOverviewControls.tsx frontend/src/components/rmr/__tests__/RmrOverviewControls.test.tsx
  git commit -m "feat: compact RMR overview filters"
  ```

  Current workspace note: Git is unavailable in this workspace; do not run `git init` as a substitute.

## Task 4: Mark the Read-Only Chart and Statistics Regions

**Files:**
- Modify: `frontend/src/components/rmr/RmrOverviewCharts.tsx:38-127`
- Modify: `frontend/src/components/rmr/__tests__/RmrOverviewCharts.test.tsx:32-51`

- [ ] **Step 1: Add the chart region marker**

  Change the outer section opening tag to:

  ```tsx
  <section
    data-testid="rmr-overview-analysis"
    className="space-y-4"
    aria-label={en ? 'RMR data analysis' : 'RMR 数据分析'}
  >
  ```

  Preserve the existing two-column chart grid. It contains all four approved charts in this order: class distribution, RMR range distribution, parameter/RMR relationship, average score contribution.

- [ ] **Step 2: Add the lower-statistics marker**

  Change the statistics section to:

  ```tsx
  <section data-testid="rmr-overview-statistics" aria-label={en ? 'Data analysis' : '数据分析'}>
  ```

  Keep the existing five values: current rows, calculable rows, mean RMR, median and range. Do not add a visible `数据分析` heading or duplicate KPI cards.

- [ ] **Step 3: Preserve read-only tooltips and no chart filtering**

  Retain the chart item `title` and `aria-label` attributes, including:

  ```tsx
  title={`${chartLabel(item.id)}: ${item.count} (${item.percentage}%)`}
  ```

  and:

  ```tsx
  title={`RMR ${item.min}-${item.max}: ${item.count}`}
  ```

  Do not add click handlers, filter state mutations or any `清除图表筛选` button.

- [ ] **Step 4: Run the chart test**

  Run:

  ```powershell
  npm test -- --run src/components/rmr/__tests__/RmrOverviewCharts.test.tsx
  ```

  Expected: PASS. Tooltip attributes and both regions are present; chart filter controls remain absent.

- [ ] **Step 5: Commit the chart-region change**

  Run:

  ```powershell
  git add frontend/src/components/rmr/RmrOverviewCharts.tsx frontend/src/components/rmr/__tests__/RmrOverviewCharts.test.tsx
  git commit -m "test: mark RMR analysis regions"
  ```

  Current workspace note: Git is unavailable in this workspace; do not run `git init` as a substitute.

## Task 5: Validate the Complete Redesign

**Files:**
- Verify: `frontend/src/components/rmr/RmrCaseSummaryPage.tsx`
- Verify: `frontend/src/components/rmr/RmrOverviewControls.tsx`
- Verify: `frontend/src/components/rmr/RmrOverviewCharts.tsx`

- [ ] **Step 1: Run all RMR overview component tests**

  Run:

  ```powershell
  npm test -- --run src/components/rmr/__tests__/RmrI18n.test.tsx src/components/rmr/__tests__/RmrOverviewControls.test.tsx src/components/rmr/__tests__/RmrOverviewCharts.test.tsx
  ```

  Expected: PASS for all selected test files.

- [ ] **Step 2: Run type checking**

  Run:

  ```powershell
  npm run typecheck
  ```

  Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 3: Build the production frontend**

  Run:

  ```powershell
  npm run build
  ```

  Expected: Vite reports `built in` and exits with code 0.

- [ ] **Step 4: Perform local visual QA at desktop width**

  Run:

  ```powershell
  npm run dev:web -- --port 5174
  ```

  In the browser, create an RMR project, open `工程总览`, and verify this visible order:

  ```text
  工程标题与导出
  筛选工具条
  A1-A6 点位分值表
  四张图表
  五项统计行
  ```

  Verify the point-row arrow reveals actual inputs without changing the table ordering, and hover a class bar and an RMR histogram bar to confirm their values are available through browser tooltips.

- [ ] **Step 5: Commit verification-only changes if any test files changed during QA**

  Run:

  ```powershell
  git status --short
  ```

  Expected in the current workspace: Git reports it is not a repository. Do not create or initialize Git metadata.
