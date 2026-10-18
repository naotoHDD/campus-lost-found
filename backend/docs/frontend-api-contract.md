# Frontend API contract

This document records the API contract implied by the existing Angular frontend. It is the source of truth for the NestJS backend implementation.

## 1. Base URL and auth

- Base API URL: `http://localhost:3000/api`
- Auth endpoints live under `/api/auth`
- Authenticated requests send a Bearer token in the `Authorization` header
- The frontend stores the JWT in `localStorage` under `token`
- Role is stored in `localStorage` under `role` and expected to be `USER` or `ADMIN`

## 2. Authentication service

### `AuthService`

- `POST http://localhost:3000/api/auth/login`
  - Request body:
    ```json
    {
      "email": "user@example.com",
      "password": "secret"
    }
    ```
  - Response:
    ```json
    {
      "accessToken": "jwt-token",
      "user": {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com",
        "role": "USER"
      }
    }
    ```

- `POST http://localhost:3000/api/auth/register`
  - Request body:
    ```json
    {
      "name": "Alice",
      "email": "alice@example.com",
      "password": "secret123"
    }
    ```
  - Response: same as login response

### Frontend expectations

- The frontend contains demo-only login paths for visual demonstration; those accounts are not backend credentials
- Demo credentials must not be hardcoded or seeded by the backend
- The backend must not return passwords and must enforce role authorization on the server

## 3. Item contract

### Model

```ts
interface Item {
  id: number;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  status: 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED';
  imageUrl?: string;
  category: { id: number; name: string };
  governorate: string;
  delegation: string;
  locality?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  itemDate: string;
  createdAt: string;
  author?: { id: number; name: string; email?: string };
}
```

### Service

- `GET http://localhost:3000/api/items`
  - Public list; returns `{ data: Item[], meta: { page, limit, total, totalPages } }`
- `GET http://localhost:3000/api/items/mine`
  - Requires a Bearer token; returns the current user's items with precise location fields
- `GET http://localhost:3000/api/items/:id`
  - Returns a public `Item`; exact locality/address are omitted and coordinates are rounded
- `POST http://localhost:3000/api/items`
  - Request: `multipart/form-data`
  - Fields expected by Angular form:
    - `type` (`LOST` or `FOUND`)
    - `title`
    - `description`
    - `category`
    - `itemDate`
    - `governorate`
    - `delegation`
    - `locality` (optional)
    - `addressText`
    - `latitude`
    - `longitude`
    - `verificationDetails`
    - `verificationQuestion`
    - `image` (optional file)
  - Response: created `Item`
- `PATCH http://localhost:3000/api/items/:id`
  - Updates item details
- `DELETE http://localhost:3000/api/items/:id`
  - Deletes item

### Search/filtering expected by UI

Frontend list view supports:

- text search over title, description, address
- filter by item `type`
- filter by category
- filter by governorate
- filter by delegation text (contains match)
- sort by recent or oldest
- pagination with page size 6

Possible query parameters:

- `search`
- `type`
- `category`
- `status` (optional backend filter; current Angular list service does not send it)
- `governorate`
- `delegation`
- `sort` (`recent` / `oldest`)
- `page`
- `limit`

A stable paginated response shape should be used, for example:

```json
{
  "data": [{ "id": 1, "title": "..." }],
  "meta": {
    "page": 1,
    "limit": 6,
    "total": 42,
    "totalPages": 7
  }
}
```

## 4. Claim contract

### Model

```ts
interface Claim {
  id: number;
  item: {
    id: number;
    title: string;
    type: 'LOST' | 'FOUND';
    status: 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED';
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  proofText: string;
  createdAt: string;
}
```

### Service

- `POST http://localhost:3000/api/items/:itemId/claims`
  - Request: `multipart/form-data`
  - Fields:
    - `proofText`
    - `answer`
    - optional `file`
  - Response: created claim record
- `GET http://localhost:3000/api/claims/my`
  - Returns claims submitted by the current user
- `GET http://localhost:3000/api/claims/received`
  - Returns claims received on items published by the current user
  - Includes the claimant identity, verification question and submitted answer so the item author can decide
- `GET http://localhost:3000/api/claims/:claimId/attachment`
  - Requires a Bearer token; only the claimant, item owner, or an admin can retrieve the private attachment
- `PATCH http://localhost:3000/api/claims/:claimId/accept`
  - Accepts a claim; only the item author or an admin can do this
  - Atomically marks the item as claimed and rejects the other pending claims for that item
- `PATCH http://localhost:3000/api/claims/:claimId/reject`
  - Rejects a claim; only the item author or an admin can do this

### Claim lifecycle expectations

- Initial claim state: `PENDING`
- Accepted state in frontend may be rendered as `ACCEPTED`
- Rejected state is `REJECTED`
- Recovery flow later uses claim id and states around return/recovery confirmation

## 5. Recovery/restoration workflow

### Service

- `GET http://localhost:3000/api/recovery/:claimId`
  - Returns the recovery state for one participant
  - Includes the meeting, current status, participant role and both confirmation flags
  - The six-digit verification code is returned only to the physical owner of the item (or an admin)
- `PATCH http://localhost:3000/api/recovery/:claimId/meeting`
  - Request:
    ```json
    {
      "location": "Bibliothèque",
      "date": "2026-09-21",
      "time": "18:00"
    }
    ```
- `POST http://localhost:3000/api/recovery/:claimId/verify-code`
  - Request:
    ```json
    {
      "code": "123456"
    }
    ```
  - Only the person physically holding the item (the finder) can verify the code
- `PATCH http://localhost:3000/api/recovery/:claimId/confirm`
  - Request:
    ```json
    {
      "confirmation": "FINDER" | "CLAIMANT"
    }
    ```
  - A participant can confirm only their own physical role; an admin can intervene when necessary

For a `FOUND` announcement, the author is the finder and the claimant is the physical owner. For a `LOST` announcement, the author is the physical owner and the claimant is the finder. The recovery is completed only after successful code verification and both participant confirmations; the claim then becomes `COMPLETED` and the item becomes `RETURNED`.

## 6. Categories and locations

The frontend references a fixed list of 24 governorates:

- Ariana, Béja, Ben Arous, Bizerte, Gabès, Gafsa, Jendouba, Kairouan, Kasserine, Kébili, Le Kef, Mahdia, La Manouba, Médenine, Monastir, Nabeul, Sfax, Sidi Bouzid, Siliana, Sousse, Tataouine, Tozeur, Tunis, Zaghouan

Item forms also use category names such as:

- Électronique
- Téléphones et tablettes
- Ordinateurs
- Audio et accessoires
- Documents
- Cartes bancaires
- Clés
- Sacs
- Vêtements
- Chaussures
- Bijoux
- Portefeuilles
- Montres
- Lunettes
- Animaux
- Jouets
- Articles de sport
- Outils
- Véhicules et accessoires
- Autre

The location model should support:

- governorate
- delegation
- locality (optional)
- addressText / landmark
- latitude
- longitude

## 7. Admin expectations

The Angular admin routes are:

- `/admin`
- `/admin/items`
- `/admin/claims`
- `/admin/users`
- `/admin/categories`
- `/admin/locations`

The frontend guards require `role === 'ADMIN'` and a valid token. The backend must enforce this on the server.

Admin backend endpoints should support:

- listing users
- listing items
- approving/rejecting claims
- managing categories
- managing locations
- dashboard statistics

## 8. File uploads

The frontend sends images using `multipart/form-data` with a field named `image` for item uploads and `file` for claims.

The backend should:

- accept PNG/JPEG item photos and PNG/JPEG/PDF claim attachments
- limit each uploaded file to 5 MiB
- save them to a configurable filesystem directory
- generate sanitized filenames with extensions derived from the accepted media type
- enforce file type and size restrictions
- expose a safe public URL via the API or a static route.

## 9. Role and authorization expectations

The frontend assumes:

- unauthed users cannot access protected routes
- only `ADMIN` can access admin routes
- logged in users can manage their own items and claims
- users cannot modify other users' content

The backend must enforce these rules instead of trusting the Angular client.

## 10. Expected error behavior

The frontend expects generic user-facing errors and does not rely on detailed API error payloads. The backend should return consistent HTTP statuses such as:

- 400 for validation errors
- 401 for missing or invalid JWT
- 403 for forbidden actions
- 404 for missing records
- 409 for duplicate email or duplicate claim logic
- 500 only for unexpected internal issues

## 11. Summary of contract decisions

The backend should preserve compatibility with the current Angular frontend by supporting the exact existing route patterns and field names above. For ambiguous areas, the backend should favor the smallest compatible implementation instead of inventing new frontend-facing conventions.
