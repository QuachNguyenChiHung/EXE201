# Employee API Inventory

Format used below:

```ts
params: ...
query: ...
body: { ... }
response: { ... }
jwt: yes/no
```

Current frontend note:
- These are mock in-memory APIs from `src/services/apiClient.ts`.
- JWT is not required right now.
- Backend route examples below use the `/api/...` pattern.

## 1. Employee Dashboard

### `GET /api/users`

```ts
params: none
query: none
body: none
response: User[]
response: { users: User[] }
jwt: no
```

### `GET /api/warehouses`

```ts
params: none
query: none
body: none
response: ColdStorage[]
jwt: no
```

### `GET /api/requests`

```ts
params: none
query: none
body: none
response: RentRequest[]
jwt: no
```

### `GET /api/contracts`

```ts
params: none
query: none
body: none
response: RentalContract[]
jwt: no
```

## 2. Manage Users

### `GET /api/users`

```ts
params: none
query: none
body: none
response: User[]
response: { users: User[] }
jwt: no
```

### `PUT /api/users/:id`

```ts
params: { id: string }
query: none
body: { name?: string; companyName?: string; phone?: string; role?: string; ... }
response: User
jwt: no
```

Example body:

```ts
{
  name: "john",
  companyName: "Logicha Co."
}
```

### `GET /api/warehouses`

```ts
params: none
query: none
body: none
response: ColdStorage[]
jwt: no
```

### `GET /api/requests`

```ts
params: none
query: none
body: none
response: RentRequest[]
jwt: no
```

## 3. Manage Warehouses

### `GET /api/warehouses`

```ts
params: none
query: none
body: none
response: ColdStorage[]
jwt: no
```

### `PUT /api/warehouses/:id`

```ts
params: { id: string }
query: none
body: { status?: "active" | "pending" | "inactive"; certifications?: Certification[]; ... }
response: ColdStorage
jwt: no
```

Example body:

```ts
{
  status: "active",
  certifications: [
    {
      id: "cert-type-1",
      name: "HACCP",
      issuer: "Verified by Logicha",
      issueDate: "2026-05-31",
      expiryDate: "2027-05-31"
    }
  ]
}
```

### `DELETE /api/warehouses/:id`

```ts
params: { id: string }
query: none
body: none
response: { success: true }
jwt: no
```

### `GET /api/cert-types`

```ts
params: none
query: none
body: none
response: CertificationType[]
jwt: no
```

## 4. Manage Certification Types

### `GET /api/cert-types`

```ts
params: none
query: none
body: none
response: CertificationType[]
jwt: no
```

### `POST /api/cert-types`

```ts
params: none
query: none
body: { id: string; code: string; name: string; description: string; category: string; createdAt: string }
response: CertificationType
jwt: no
```

Example body:

```ts
{
  id: "ct-haccp-abc123",
  code: "HACCP",
  name: "HACCP",
  description: "Hazard Analysis Critical Control Point",
  category: "food_safety",
  createdAt: "2026-05-31T00:00:00.000Z"
}
```

### `PUT /api/cert-types/:id`

```ts
params: { id: string }
query: none
body: { code?: string; name?: string; description?: string; category?: string; createdAt?: string }
response: CertificationType
jwt: no
```

Example body:

```ts
{
  name: "ISO 22000 - Updated",
  description: "Updated description"
}
```

### `DELETE /api/cert-types/:id`

```ts
params: { id: string }
query: none
body: none
response: { success: true }
jwt: no
```

## 5. Data Migration

### `GET /api/seed/status`

```ts
params: none
query: none
body: none
response: { counts: { users: number; warehouses: number; requests: number; contracts: number; ratings: number }, seededAt: string | null, seeded: boolean }
jwt: no
```

### `POST /api/seed`

```ts
params: { payload: SeedPayload; force?: boolean; dataVersion?: string }
query: none
body: {
  users: RegisteredUser[];
  warehouses: ColdStorage[];
  requests: RentRequest[];
  contracts: RentalContract[];
  ratings: WarehouseRating[];
}
response: { status: "seeded" | "already seeded", counts: { users: number; warehouses: number; requests: number; contracts: number; ratings: number } }
jwt: no
```

Example body:

```ts
{
  users: [
    {
      id: "user-1",
      email: "john@example.com",
      password: "password",
      name: "john",
      role: "renter",
      createdAt: "2026-05-31T00:00:00.000Z"
    }
  ],
  warehouses: [],
  requests: [],
  contracts: [],
  ratings: []
}
```

### `POST /api/seed/:resource`

```ts
params: { resource: string; items: any[]; force?: boolean }
query: none
body: any[]
response: { status: "seeded", resource: string, count: number }
jwt: no
```

### `DELETE /api/seed`

```ts
params: none
query: none
body: none
response: { status: "cleared", message: string }
jwt: no
```

### `DELETE /api/seed/:resource`

```ts
params: { resource: string }
query: none
body: none
response: { status: "cleared", resource: string, cleared: number }
jwt: no
```

### `GET /api/users` / `GET /api/warehouses` / `GET /api/requests` / `GET /api/contracts` / `GET /api/ratings`

```ts
params: none
query: none
body: none
response: Array<User | ColdStorage | RentRequest | RentalContract | WarehouseRating>
jwt: no
```

## 6. Indirect APIs used by employee flows

### `POST /api/auth/login`

Route: `POST /api/auth/login`

```ts
params: { email: string; password: string }
query: none
body: none
response: User
jwt: no
```

### `POST /api/auth/register`

Route: `POST /api/auth/register`

```ts
params: { user: RegisteredUser }
query: none
body: {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "renter" | "warehouse" | "employee";
  createdAt: string;
}
response: User
jwt: no
```

### `GET /api/bookmarks/:userId`

Route: `GET /api/bookmarks/:userId`

```ts
params: { userId: string }
query: none
body: none
response: { warehouseIds: string[] }
jwt: no
```

### `PUT /api/bookmarks/:userId`

Route: `PUT /api/bookmarks/:userId`

```ts
params: { userId: string; warehouseIds: string[] }
query: none
body: none
response: { warehouseIds: string[] }
jwt: no
```

## JWT summary

- JWT: no for all current employee-side APIs.
- If this switches to a real backend later, admin actions would likely become JWT-protected.