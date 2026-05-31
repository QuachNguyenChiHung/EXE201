# Frontend Pages Optimization Plan

Date: 2026-05-31

Goal: Reduce file size, improve readability, and centralize logic by extracting hooks and reusable components across employee pages.

Priority pages and proposed refactors

- `src/app/pages/employee/DataMigration.tsx` (already optimized)
  - Status: Refactored — now uses `ResourceCard`, `GlobalActionBar`, `LogViewer`, and `useSeedStatus`.

- `src/app/pages/employee/ManageWarehouses.tsx` (done)
  - Status: Refactored — extracted `ApproveModal`, `ConfirmModal`, and `useWarehouses` hook.

- `src/app/pages/employee/ManageUsers.tsx` (done)
  - Status: Refactored — extracted `useUsers` hook.

- `src/app/pages/employee/ManageCertTypes.tsx` (next)
  - Tasks:
    1. Extract data + side-effect logic into `useCertTypes` hook (fetch, create, update, delete, loading state).
    2. Keep presentational UI in page; call hook methods from handlers.
    3. Optionally extract the create/edit form into `CertTypeForm` component.

- `src/app/pages/employee/EmployeeDashboard.tsx` (next-high)
  - Tasks:
    1. Extract stats computation into `useDashboardStats` hook.
    2. Extract small widgets (QuickActionCard) into components.

- Other pages (lower priority):
  - `ManageRequests`, `ManageContracts`, `ManageRatings` — apply same pattern when needed: move data actions to hooks, extract large components.

Implementation plan

1. Create plan file (this document).
2. Implement refactor for `ManageCertTypes` (hook + page changes).
3. Run types check and quick manual QA.
4. Proceed to `EmployeeDashboard` refactor (hook + small components).
5. Iterate on remaining pages.

Notes
- Prefer hooks for data / side effects and keep pages as thin as possible.
- Extract modals and repeated UI blocks into `src/app/components/employee/`.
- Run `get_errors` / typecheck after each change.
