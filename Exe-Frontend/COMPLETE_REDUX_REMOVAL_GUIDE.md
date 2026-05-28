# Complete Redux Removal - Implementation Guide

## Files Updated ✅

1. ✅ src/context/AppContext.tsx - Created
2. ✅ src/main.tsx - Wrapped with AppProvider
3. ✅ src/app/components/RateWarehouseModal.tsx
4. ✅ src/app/components/WarehouseCard.tsx
5. ✅ src/app/components/WarehouseReviewsModal.tsx
6. ✅ src/app/components/SystemStatus.tsx
7. ✅ src/app/pages/RegisterPage.tsx
8. ✅ src/app/pages/renter/RentedProperties.tsx
9. ✅ src/app/pages/renter/AISearchWarehouse.tsx

## Remaining Files - Quick Update Pattern

For each file below, apply this exact pattern:

### 1. Update Imports
```typescript
// REMOVE these lines:
import { useStoreContext } from '../../../store/index';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { anyAction } from '../../../store/slices/anySlice';

// ADD this line:
import { useApp } from '../../../context/AppContext';
```

### 2. Update Hook Usage

```typescript
// REMOVE:
const { state, dispatch } = useStoreContext();
const user = useAppSelector(s => s.auth.user);
const warehouses = useAppSelector(s => s.warehouses.list);
const dispatch = useAppDispatch();

// REPLACE WITH:
const { 
  user, 
  warehouses, 
  requests,
  contracts,
  ratings,
  bookmarkedIds,
  compareIds,
  // ... and any action methods you need
  createWarehouse,
  updateWarehouse,
  toggleBookmark,
  etc
} = useApp();
```

### 3. Update Action Calls

```typescript
// REMOVE:
dispatch(createWarehouseAsync(data));
dispatch(toggleBookmarkAsync(id));
dispatch(fetchWarehouses());

// REPLACE WITH:
await createWarehouse(data);
await toggleBookmark(id);
await refreshWarehouses();
```

### 4. Update State Access

```typescript
// REMOVE:
state.auth.user
state.warehouses.list
state.bookmarks.ids
state.requests.list

// REPLACE WITH:
user
warehouses
bookmarkedIds
requests
```

## File-Specific Updates

### src/app/pages/renter/Bookmarks.tsx
```typescript
const { 
  user,
  warehouses,
  bookmarkedIds,
  compareIds,
  toggleBookmark,
  toggleCompare,
  clearCompare,
  clearAllBookmarks
} = useApp();
```

### src/app/pages/renter/RentalRequests.tsx
```typescript
const { 
  user,
  requests,
  withdrawRequest,
  refreshRequests
} = useApp();
```

### src/app/pages/renter/SearchWarehouse.tsx
```typescript
const { 
  warehouses,
  refreshWarehouses
} = useApp();
```

### src/app/pages/renter/WarehouseDetail.tsx
```typescript
const { 
  user,
  bookmarkedIds,
  compareIds,
  toggleBookmark,
  toggleCompare,
  createRequest
} = useApp();
```

### src/app/pages/warehouse/AddWarehouse.tsx
```typescript
const { 
  user,
  createWarehouse
} = useApp();
```

### src/app/pages/warehouse/CreateContract.tsx
```typescript
const { 
  user,
  requests,
  createContract,
  updateRequest
} = useApp();
```

### src/app/pages/warehouse/EditWarehouse.tsx
```typescript
const { 
  user,
  warehouses,
  updateWarehouse
} = useApp();
```

### src/app/pages/warehouse/MyWarehouses.tsx
```typescript
const { 
  user,
  warehouses,
  updateWarehouse,
  refreshWarehouses
} = useApp();
```

### src/app/pages/warehouse/OwnerContracts.tsx
```typescript
const { 
  user,
  contracts,
  warehouses,
  updateContract,
  cancelContract,
  refreshContracts
} = useApp();
```

### src/app/pages/warehouse/SubscriptionManagement.tsx
```typescript
const { 
  user,
  warehouses,
  updateWarehouse
} = useApp();
```

### src/app/pages/warehouse/WarehouseRequests.tsx
```typescript
const { 
  user,
  requests,
  warehouses,
  contracts,
  updateRequest,
  refreshRequests
} = useApp();
```

### src/app/pages/employee/DataMigration.tsx
```typescript
const { 
  warehouses,
  requests,
  contracts,
  ratings,
  refreshWarehouses,
  refreshRequests,
  refreshContracts,
  refreshRatings
} = useApp();
```

### src/app/pages/employee/ManageUsers.tsx
```typescript
const { 
  // Users are fetched directly from API
  // No user list in context yet
} = useApp();
```

### src/app/pages/employee/ManageWarehouses.tsx
```typescript
const { 
  warehouses,
  updateWarehouse,
  deleteWarehouse,
  refreshWarehouses
} = useApp();
```

## After All Updates

1. Delete the entire `src/store` directory
2. Run `npx tsc --noEmit` to check for errors
3. Fix any remaining type errors
4. Test the app

## Common Patterns

### Loading States
```typescript
const { loading } = useApp();
if (loading.warehouses) return <div>Loading...</div>;
```

### Refresh Data
```typescript
useEffect(() => {
  refreshWarehouses();
  refreshRequests();
}, []);
```

### Create/Update/Delete
```typescript
const handleCreate = async () => {
  await createWarehouse(data);
  // Data automatically refreshed
};

const handleUpdate = async (id: string) => {
  await updateWarehouse(id, updates);
  // Data automatically refreshed
};
```

## Notes

- All actions return Promises - always use `await`
- Data is automatically refreshed after create/update/delete
- No more `dispatch()` calls
- No more Redux selectors
- State is accessed directly from the hook
