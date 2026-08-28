# RockMass Calculator Code Optimization Design

## Goal

Reduce avoidable complexity across the frontend while preserving calculation results, persistence formats, and Electron update/license behavior.

## Scope

- Low-risk cleanup: dead imports/exports, repeated browser/Electron capability checks, duplicated error handling, and unnecessary derived-state work.
- Structural cleanup: split the settings page into focused sections and extract static About page content/layout boundaries where the existing code already has clear seams.
- Performance: retain memoization only where it prevents repeated non-trivial work or stabilizes props for rendered lists; do not add speculative caches.
- Exclusions: generated `frontend/dist`, release artifacts, calculation formulas, binary formats, and new dependencies.

## Acceptance

- Existing behavior and calculation outputs remain unchanged.
- `npm run typecheck --prefix frontend` exits successfully.
- `npm run test --prefix frontend` exits successfully.
- `npm run build` exits successfully.

## Constraints

The workspace has no `.git` metadata, so the design and implementation are kept as filesystem changes without commits.
