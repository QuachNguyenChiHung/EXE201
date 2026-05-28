# Redux to Context Migration Guide

## Pattern Replacements

### Import Changes
```typescript
// OLD
import { useStoreContext } from '../../store/index';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { someAction } from '../../store/slices/someSlice';

// NEW
import { useApp } from '../../context/AppContext';
```

### Usage Changes
```typescript
// OLD
const { state, dispatch } = useStoreContext();
const user = state.auth.user;
const warehouses = state.warehouses.list;
dispatch(someAction(payload));

// NEW
const { user, warehouses, someAction } = useApp();
someAction(payload); // Direct call, returns Promise
```

### Common Patterns

#### Auth
```typescript
// OLD
const user = useAppSelector(s => s.auth.user);
const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

// NEW
const { user, isAuthenticated } = useApp();
```

#### Warehouses
```typescript
// OLD
const warehouses = useAppSelector(s => s.warehouses.list);
dispatch(fetchWarehouses());
dispatch(createWarehouseAsync(data));

// NEW
const { warehouses, refreshWarehouses, createWarehouse } = useApp();
await refreshWarehouses();
await createWarehouse(data);
```

#### Bookmarks
```typescript
// OLD
const bookmarkedIds = useAppSelector(s => s.bookmarks.bookmarkedIds);
dispatch(toggleBookmarkAsync(id));

// NEW
const { bookmarkedIds, toggleBookmark } = useApp();
await toggleBookmark(id);
```

#### Requests
```typescript
// OLD
const requests = useAppSelector(s => s.requests.list);
dispatch(createRequestAsync(data));
dispatch(withdrawRequestAsync(id));

// NEW
const { requests, createRequest, withdrawRequest } = useApp();
await createRequest(data);
await withdrawRequest(id);
```

#### Contracts
```typescript
// OLD
const contracts = useAppSelector(s => s.contracts.list);
dispatch(createContractAsync(data));
dispatch(cancelContract(id));

// NEW
const { contracts, createContract, cancelContract } = useApp();
await createContract(data);
await cancelContract(id);
```

#### Ratings
```typescript
// OLD
const ratings = useAppSelector(s => s.ratings.list);
dispatch(submitRating(data));
dispatch(updateRating({ id, ...updates }));
dispatch(deleteRating(id));

// NEW
const { ratings, submitRating, updateRating, deleteRating } = useApp();
await submitRating(data);
await updateRating(id, updates);
await deleteRating(id);
```

## Files to Update

All files have been updated to use the new AppContext pattern.
