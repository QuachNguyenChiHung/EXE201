**Extraction Plan — Employee UI Components**

Goal: extract shared UI primitives from employee pages into reusable components to reduce duplication and make pages easier to maintain.

Scope:
- Pages inspected: DataMigration.tsx, EmployeeDashboard.tsx, ManageUsers.tsx, ManageWarehouses.tsx, ManageCertTypes.tsx
- Existing shared components: `Navbar`, `AIStatusPanel`, `AIConversationViewer`, `DataLoader`, `WarehouseCard`, `ui/*`

High-level steps:
1. Extract `Modal` and `ConfirmDialog` (high priority)
   - Target: `src/app/components/Modal.tsx`
   - Sources: ManageUsers (EditNameModal), ManageWarehouses (ConfirmModal, ApproveModal), ManageCertTypes (create/edit modal)

2. Extract `SearchInput` (high)
   - Target: `src/app/components/SearchInput.tsx`
   - Sources: ManageUsers, ManageWarehouses, ManageCertTypes

3. Extract `StatsCard` / Metric tile (medium)
   - Target: `src/app/components/StatsCard.tsx`
   - Sources: EmployeeDashboard, ManageWarehouses, ManageCertTypes

4. Extract `EntityRow` + `ExpandablePanel` (medium)
   - Target: `src/app/components/EntityRow.tsx`, `src/app/components/ExpandablePanel.tsx`
   - Sources: UserRow (ManageUsers), WarehouseRow (ManageWarehouses), cert type rows

5. Small primitives (low): `Badge`, `ActionButton`, `DocumentLink`, `ConfirmDialog` variants
   - Target: `src/app/components/ui/Badge.tsx`, `src/app/components/ui/ActionButton.tsx`

Prioritization: start with Modal & SearchInput → StatsCard → EntityRow → primitives.

Minimal acceptance criteria:
- Each extracted component has a clear prop API and is imported by at least one employee page.
- No behavioral changes to existing pages after swap.

Next steps (after approval): scaffold `Modal.tsx` and `SearchInput.tsx`, replace one page to validate.
