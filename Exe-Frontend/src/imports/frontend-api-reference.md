# Frontend API Reference

This project currently uses an in-memory mock client in [src/services/apiClient.ts](../services/apiClient.ts). The routes below document the REST-style contract the frontend needs, plus the exact external URLs it calls today.

## Base URLs

- Internal mock APIs: no HTTP backend in the current implementation.
- Nominatim search: `https://nominatim.openstreetmap.org/search`
- Nominatim reverse geocoding: `https://nominatim.openstreetmap.org/reverse`

## Internal API Contract

### Users

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/users` | - | - | - |
| GET | `/api/users/:id` | `id` | - | - |
| POST | `/api/users` | - | - | `RegisteredUser` |
| PATCH | `/api/users/:id` | `id` | - | `Partial<User>` |
| DELETE | `/api/users/:id` | `id` | - | - |

`User` fields: `id`, `email`, `name`, `role`, `companyName?`, `phone?`, `avatarUrl?`, `createdAt`.

`RegisteredUser` adds: `password`.

### Warehouses

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/warehouses` | - | - | - |
| GET | `/api/warehouses/:id` | `id` | - | - |
| POST | `/api/warehouses` | - | - | `ColdStorage` |
| PATCH | `/api/warehouses/:id` | `id` | - | `Partial<ColdStorage>` |
| DELETE | `/api/warehouses/:id` | `id` | - | - |

Used by renter detail, search, dashboard, warehouse owner pages, employee management, and data migration.

### Requests

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/requests` | - | - | - |
| GET | `/api/requests/:id` | `id` | - | - |
| POST | `/api/requests` | - | - | `RentRequest` |
| PATCH | `/api/requests/:id` | `id` | - | `Partial<RentRequest>` |
| DELETE | `/api/requests/:id` | `id` | - | - |

`RentRequest` body includes:

- `warehouseId`, `renterId`
- optional `sectionId`, `sectionName`, `sectionIds`, `isWholeWarehouse`
- renter snapshot fields: `renterName`, `renterPhone`, `renterEmail`, `renterCompany?`
- request detail fields: `cargoType`, `requestedCapacity`, `durationLabel`, `startDate`, `endDate?`, `priceTierValue?`, `priceTierUnit?`, `priceTierLabel?`, `message?`
- lifecycle fields: `status`, `submittedAt`, `updatedAt`

### Contracts

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/contracts` | - | - | - |
| GET | `/api/contracts/:id` | `id` | - | - |
| POST | `/api/contracts` | - | - | `RentalContract` |
| PATCH | `/api/contracts/:id` | `id` | - | `Partial<RentalContract>` |
| DELETE | `/api/contracts/:id` | `id` | - | - |

`RentalContract` body includes:

- `id`, `requestId?`, `renterId`, `ownerId?`, `warehouseId`
- `sectionId?`, `sectionIds?`, `isWholeWarehouse?`
- pricing and duration fields: `rentedCapacity`, `startDate`, `endDate`, `monthlyRate`, `status`, `contractRef`, `notes?`
- optional metadata fields for PDF/form workflows

### Ratings

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/ratings` | - | - | - |
| GET | `/api/ratings/:id` | `id` | - | - |
| POST | `/api/ratings` | - | - | `WarehouseRating` |
| PATCH | `/api/ratings/:id` | `id` | - | `Partial<WarehouseRating>` |
| DELETE | `/api/ratings/:id` | `id` | - | - |

### Certification Types

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/cert-types` | - | - | - |
| GET | `/api/cert-types/:id` | `id` | - | - |
| POST | `/api/cert-types` | - | - | `CertificationType` |
| PATCH | `/api/cert-types/:id` | `id` | - | `Partial<CertificationType>` |
| DELETE | `/api/cert-types/:id` | `id` | - | - |

### Auth

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | - | - | `{ email, password }` |
| POST | `/api/auth/register` | - | - | `RegisteredUser` |

Login body is exactly `email` and `password`.

### Bookmarks

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/bookmarks/:userId` | `userId` | - | - |
| PUT | `/api/bookmarks/:userId` | `userId` | - | `{ warehouseIds: string[] }` |

The UI expects bookmark reads and writes to be user-scoped.

### Seed / Data Migration

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/seed/check` | - | - | - |
| GET | `/api/seed/status` | - | - | - |
| POST | `/api/seed` | - | `force?`, `dataVersion?` | `{ users, warehouses, requests, contracts, ratings }` |
| DELETE | `/api/seed` | - | - | - |
| POST | `/api/seed/:resource` | `resource` | `force?` | `{ resource, items, force? }` |
| DELETE | `/api/seed/:resource` | `resource` | - | - |

`resource` is one of: `users`, `warehouses`, `requests`, `contracts`, `ratings`.

### Storage

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| POST | `/api/storage/image` | - | - | `multipart/form-data` with `file` |
| POST | `/api/storage/doc` | - | - | `multipart/form-data` with `file` |

The frontend uses these for image and document uploads in warehouse create/edit flows and certification uploads.

### AI

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| POST | `/api/ai/chat` | - | - | `AIRequestPayload` |
| GET | `/api/ai/status` | - | - | - |
| POST | `/api/ai/conversations` | - | - | `AIConversationRecord` |
| GET | `/api/ai/conversations` | - | `userId?` | - |
| DELETE | `/api/ai/conversations/:id` | `id` | - | - |

`AIRequestPayload` body:

- `prompt: string`
- `criteria: Record<string, string[]>`
- `matchingWarehouses: ColdStorage[]`
- `conversationHistory: { role: "user" | "ai"; content: string }[]`
- `isInitialHandshake: boolean`
- `hasCriteria: boolean`

`AIConversationRecord` body includes:

- `id`, `userId`, `userName`, `userEmail?`
- `criteria`, `messages`
- `warehouseCount`, `totalInputTokens`, `totalOutputTokens`
- `createdAt`, `updatedAt`

### Health

| Method | URL | Params | Query | Body |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | - | - | - |
| GET | `/api/health/kv` | - | - | - |

`kv` is the mock data-store ping used by the diagnostics panel.

## External Location APIs

### Nominatim Search

Used by warehouse create/edit pages to search Vietnamese addresses.

- Method: `GET`
- URL: `https://nominatim.openstreetmap.org/search`
- Headers: `Accept-Language: vi`
- Query:
  - `format=jsonv2`
  - `addressdetails=1`
  - `countrycodes=vn`
  - `limit=5`
  - `street=<house number + street>`
  - `city=<city>`
  - `state=<state>`

### Nominatim Reverse Geocoding

Used by warehouse create/edit pages to resolve coordinates into an address.

- Method: `GET`
- URL: `https://nominatim.openstreetmap.org/reverse`
- Headers: `Accept-Language: vi`
- Query:
  - `format=jsonv2`
  - `addressdetails=1`
  - `zoom=18`
  - `lat=<latitude>`
  - `lon=<longitude>`

## Frontend Usage Notes

- The renter warehouse detail route reads `warehousesAPI.getById(id)` first and falls back to the mock service if needed.
- The search page filters client-side; it does not call a search backend.
- The app is currently mock-backed, so the `/api/*` URLs above are the contract to implement if you move this frontend to a real backend.