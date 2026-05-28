# Redux Removal Plan

Status: draft — documentation only. Files will NOT be deleted or modified by this document.

## Goal

Remove Redux (RTK + react-redux) and all related code from the `src/` tree. This document lists detected artifacts, affected files, a safe, non-destructive removal plan, and recommended migration approaches. Follow the steps below when you are ready to apply the changes.

## Detected Redux artifacts (root)

- `src/store/index.ts`
- `src/store/hooks.ts`
- `src/store/persistMiddleware.ts`
- `src/store/slices/aiSlice.ts`
- `src/store/slices/authSlice.ts`
- `src/store/slices/bookmarkSlice.ts`
- `src/store/slices/contractSlice.ts`
- `src/store/slices/ratingSlice.ts`
- `src/store/slices/requestSlice.ts`
- `src/store/slices/warehouseSlice.ts`

## Example components/pages importing the store or hooks

These were discovered by searching for `store/` imports; there may be additional files. Before removing Redux, update all files that import from `store` or `store/slices`.

- `src/app/App.tsx` (wraps app with `Provider` and imports `store`)
- `src/app/components/DataLoader.tsx`
- `src/app/components/RateWarehouseModal.tsx`
- `src/app/components/WarehouseReviewsModal.tsx`
- `src/app/components/WarehouseCard.tsx`
- `src/app/components/Navbar.tsx`
- `src/app/components/ProtectedRoute.tsx`
- `src/app/pages/warehouse/MyWarehouses.tsx`
- `src/app/pages/warehouse/AddWarehouse.tsx`
- `src/app/pages/warehouse/WarehouseDashboard.tsx`
- `src/app/pages/warehouse/WarehouseRequests.tsx`
- `src/app/pages/employee/ManageWarehouses.tsx`
- `src/app/pages/employee/EmployeeDashboard.tsx`
- `src/app/pages/employee/ManageUsers.tsx`
- `src/app/pages/employee/DataMigration.tsx`

Use a repo-wide search for `store/`, `useAppSelector`, `useAppDispatch`, `configureStore`, `createSlice` to locate all usages before applying removals.

## Non-destructive removal plan (recommended)

1. Create a feature branch and a backup tag:

   - `git checkout -b feat/remove-redux`
   - `git commit -m "WIP: snapshot before Redux removal"` (or create a tag)

2. Inventory & tests

   - Run the app and tests to capture current baseline.
   - Search for all imports referencing `store`:

     - `rg "from ['\"]([^'\"]*store)[^'\"]*['\"]" src -n`

3. Replace usage incrementally per feature

   - Pick one feature/slice (e.g., `warehouseSlice`) and migrate it first.
   - Replace `useAppSelector` and `useAppDispatch` with a local context or a lightweight state library: `zustand` or React Context + useReducer.

   Example: simple context wrapper for the `warehouse` feature (sketch)

   ```ts
   // src/feature/warehouse/context.tsx
   import React, { createContext, useReducer, useContext } from 'react';

   type State = { list: Warehouse[] };
   const WarehouseContext = createContext<any>(null);

   export function WarehouseProvider({ children }) {
     const [state, dispatch] = useReducer(warehouseReducer, initialState);
     return <WarehouseContext.Provider value={{ state, dispatch }}>{children}</WarehouseContext.Provider>;
   }

   export const useWarehouse = () => useContext(WarehouseContext);
   ```

4. Remove global `Provider`

   - Once all usages are migrated, remove the `Provider` and `store` import from `src/app/App.tsx`.

5. Remove store files and slices

   - Delete `src/store/*` and `src/store/slices/*` once nothing imports them.

6. Remove dependencies from package.json (final step)

   - `pnpm remove @reduxjs/toolkit react-redux` (or `npm/yarn` equivalent)

7. Run build & tests

   - `pnpm build` or the project's normal build/test workflow.

## Quick checklist before deleting files

- Ensure there are zero imports referencing `store` or `store/slices`.
- Ensure all previously global state logic is migrated or intentionally removed.
- Run the application locally and run tests.
- Create a PR so reviewers can validate the changes.

## Migration recommendations

- For small-to-medium apps: use React Context + `useReducer` per domain slice.
- For simple, scalable state: use `zustand` (small, no Provider boilerplate).
- For async logic: prefer direct service calls + local state or use `react-query` for server state.

## Example commands

- Create branch: `git checkout -b feat/remove-redux`
- Find usages: `rg "useAppSelector|useAppDispatch|store/" src -n`
- Remove packages (after full migration): `pnpm remove @reduxjs/toolkit react-redux`

## Next steps I can do for you (pick one)

1. Generate a non-applied patch that removes `src/store` and updates `App.tsx` imports (I will NOT apply it unless you say so).
2. Migrate a single slice (pick which) to a Context or `zustand` example and update all import sites.
3. Search & prepare a complete list of all component files that reference the store (full inventory).

---

If you want me to proceed with any of the next steps, tell me which one and I will prepare the changes safely (branch + patch) without deleting files until you confirm.
