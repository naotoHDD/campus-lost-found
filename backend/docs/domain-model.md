# Proposed relational domain model

This document describes the domain model recommended for the NestJS + Prisma backend with the current Angular frontend contract as the source of truth.

## 1. Core entities

### User

Represents a registered account.

Fields:
- id: Int @id @default(autoincrement())
- name: String
- email: String @unique
- passwordHash: String
- role: Role @default(USER)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

Relations:
- items: Item[]
- claims: Claim[]
- notifications: Notification[]

### Role enum

- USER
- ADMIN

### Category

Represents a classification for a lost or found item.

Fields:
- id: Int @id @default(autoincrement())
- name: String @unique
- slug: String @unique
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

Relations:
- items: Item[]

### Location

Represents the geographic context of an item. This keeps the country-specific data normalized and searchable.

Fields:
- id: Int @id @default(autoincrement())
- governorate: String
- delegation: String
- locality: String?
- addressText: String?
- latitude: Decimal?
- longitude: Decimal?
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

Relations:
- items: Item[]

### Item

Represents a lost or found post.

Fields:
- id: Int @id @default(autoincrement())
- title: String
- description: String
- type: ItemType
- status: ItemStatus @default(ACTIVE)
- itemDate: DateTime
- imageUrl: String?
- verificationDetails: String?
- verificationQuestion: String?
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

Relations:
- author: User
- category: Category
- location: Location
- claims: Claim[]

### ItemType enum

- LOST
- FOUND

### ItemStatus enum

- ACTIVE
- CLAIMED
- RETURNED
- CLOSED

### Claim

Represents an item-claim submission by a user.

Fields:
- id: Int @id @default(autoincrement())
- itemId: Int
- claimantId: Int
- proofText: String
- answer: String?
- attachmentUrl: String?
- status: ClaimStatus @default(PENDING)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

Relations:
- item: Item
- claimant: User
- recovery: Recovery?

### ClaimStatus enum

- PENDING
- ACCEPTED
- REJECTED
- COMPLETED

### Recovery

Tracks the final handoff process between the finder and claimant.

Fields:
- id: Int @id @default(autoincrement())
- claimId: Int @unique
- meetingLocation: String?
- meetingDate: DateTime?
- verificationCode: String?
- finderConfirmed: Boolean @default(false)
- claimantConfirmed: Boolean @default(false)
- status: RecoveryStatus @default(PENDING)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

Relations:
- claim: Claim

### RecoveryStatus enum

- PENDING
- SCHEDULED
- VERIFIED
- COMPLETED
- CANCELLED

### Notification

Tracks simple, user-visible backend notifications.

Fields:
- id: Int @id @default(autoincrement())
- userId: Int
- title: String
- message: String
- isRead: Boolean @default(false)
- createdAt: DateTime @default(now())

Relations:
- user: User

## 2. Relationship summary

```text
User 1 --- * Item
User 1 --- * Claim
User 1 --- * Notification
Category 1 --- * Item
Location 1 --- * Item
Item 1 --- * Claim
Claim 1 --- 1 Recovery
```

## 3. Notes for compatibility

- The frontend uses an item status set of `ACTIVE`, `CLAIMED`, `RETURNED`, `CLOSED`, while the backend should map these cleanly to a Prisma enum.
- The frontend claim status uses `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`; the backend should expose the same values to preserve compatibility while still using a relational model.
- In the API layer, the application should hide database implementation details and return simplified DTOs rather than Prisma entities.
- Private user and contact data must be returned only to the owner or an authorized admin.

## 4. Seed data

The backend should seed:
- default admin user from environment variables
- default categories matching the Angular UI
- default Tunisian governorates as reference data if needed

This must be done in Prisma seed logic, not by hard-coded values inside every service.
