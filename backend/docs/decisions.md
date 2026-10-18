# Implementation decisions

This document records the choices made where the frontend contract is ambiguous or inconsistent.

## 1. Demo credentials are not backend credentials

The frontend README contains demo accounts used only for visual testing. The backend must not bake these into production configuration. The backend will use environment variables for the admin seed user, and the demo credentials will remain purely frontend-only.

## 2. Accepted claim status naming

The Angular frontend uses `ACCEPTED` in the claim model and service methods. The API and database therefore use `ACCEPTED`; no `APPROVED` alias is introduced.

## 3. Claim lifecycle uses the same recovery workflow

The frontend does not define a separate recovery object; it calls endpoints under `/api/recovery/:claimId/...` and relies on the same claim id. The backend should therefore treat recovery as a sub-process of a claim rather than inventing a completely separate domain path.

## 4. Public versus participant location precision

Public item details retain governorate/delegation and round map coordinates to two decimal places. Exact locality, address/landmark, and coordinates are available only through the authenticated owner's item listing or edit response. This follows the location privacy note in the Angular item detail page.

## 5. Category and location data are normalized in the database

The frontend uses fixed governorate values and category names. Instead of storing raw strings in every item record, the backend will normalize to a `Location` and `Category` model and return the names as nested objects where needed for Angular compatibility.

## 6. File field names follow the frontend

The frontend uploads item photos under `image` and claim attachments under `file`. To preserve compatibility, the backend will accept those exact field names while normalizing storage internally.

## 7. The API keeps the `/api` namespace only

The frontend expects all routes under `http://localhost:3000/api`. The backend will not add additional routes outside that namespace unless this becomes technically unavoidable.

## 8. Paginated item list response

The backend returns item lists as `{ data, meta }` for server-side pagination, while the original Angular item service typed the response as `Item[]` and did not send paging options. The Angular service type now represents the paginated response; the page can consume `data` while pagination UI is integrated.

## 9. Owner item listing and private attachment route

The current Angular service has no request for a user's own posts or for downloading claim attachments, although both workflows are required by the project brief. The backend provides authenticated `/api/items/mine` and `/api/claims/:claimId/attachment` routes. The attachment route is restricted to claim participants and admins; claim records expose that route instead of a public storage path.

## 10. Status filtering is optional

The Angular list currently sends type/category/location/search parameters but no item-status filter. The backend accepts a validated status query for admin/owner workflows without requiring a frontend rewrite.

## 11. No full frontend rewrite is required

The backend is built around the actual frontend service calls and form fields already present in the Angular project so the app remains compatible without frontend patching.

## 12. VM provisioning is manual and documented

The deployment target is a manually provisioned Ubuntu Server 24.04 LTS virtual machine. This choice makes Linux users, SSH, firewall rules, Docker installation, networks, volumes, and reverse proxy behavior explicit. The immutable decision and procedure are recorded in `../../docs/ARCHITECTURE.md` and `../../docs/VM-DEPLOYMENT.md`.

## 13. Recovery codes are short-lived

Scheduling a recovery generates a six-digit code with a 30-minute lifetime and five verification attempts. Rescheduling rotates the code and resets both confirmations. Successful verification removes the plaintext code and records `codeVerifiedAt` for traceability.
