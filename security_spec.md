# Zero-Trust Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Master Identity Gate**: Every farm profile (`/farmProfiles/{userId}`) is keyed directly by `request.auth.uid == userId`. No `list` access is permitted on `/farmProfiles` to guarantee strict PII isolation (`phone`, `location`, `ownerName`, `appPasswordHash`).
2. **Verified Email Requirement**: Every write (`create`, `update`, `delete`) across all collections strictly mandates `request.auth != null && request.auth.token.email_verified == true`.
3. **Parent Profile Consistency**: No child operational record (`/animals/{animalId}`, `/feedStocks/{feedId}`, `/transactions/{transactionId}`, `/sales/{saleId}`) can be created unless `/farmProfiles/$(request.auth.uid)` exists (`exists()` check on `create`) and `incoming().ownerId == request.auth.uid`.
4. **Immutable Ownership & Creation Time**: `ownerId` and `createdAt` can never be mutated during `update`.
5. **Temporal Integrity**: On `create`, `createdAt == request.time && updatedAt == request.time`. On `update`, `updatedAt == request.time`.
6. **Secure List Enforcement (Zero Client Trust)**: Every `allow list` rule enforces `isSignedIn() && resource.data.ownerId == request.auth.uid` with zero `get()`/`exists()` calls inside `list`.
7. **Strict Key & Size Boundaries**: Every write validates `keys().hasAll(...)` and `keys().hasOnly(...)`, regex ID guards (`^[a-zA-Z0-9_\-]+$`, max 128 chars), string `.size()` bounds, enum membership, and numeric bounds.
8. **Bootstrapped & Trusted Admin Gate**: `isAdmin()` strictly requires `request.auth != null && request.auth.token.email_verified == true` AND either the bootstrapped runtime email (`gdyounus2025@gmail.com`) or `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`. Non-admins can never self-create or mutate `/admins/{adminId}`.
9. **Mandatory Admin Password Hash**: `FarmProfile` enforces `hasAppPassword == true`, `appPasswordHash.size() == 64`, and `appPasswordSalt.size() >= 16` so no profile can disable password protection.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Create)**: Authenticated verified user `uid_attacker` creates `/animals/anim_1` with `ownerId: "uid_victim"`. -> **Expected: PERMISSION_DENIED**.
2. **Payload 2 (Unverified Email Spoof & Admin Email Spoof)**: Authenticated user with `email: "gdyounus2025@gmail.com"` and `email_verified: false` attempts `create` on `/farmProfiles/uid_1` or `/admins/uid_1`. -> **Expected: PERMISSION_DENIED**.
3. **Payload 3 (Shadow Ghost Field Injection on Create)**: Verified user creates `/animals/anim_1` with all valid fields plus `"isAdmin": true` or attempts self-registration in `/admins/uid_attacker`. -> **Expected: PERMISSION_DENIED** (`hasOnly` + `isAdmin()` blocks self-assigned roles).
4. **Payload 4 (Shadow Ghost Field Injection on Update)**: Verified owner updates `/feedStocks/feed_1` adding `"unlimitedStock": true`. -> **Expected: PERMISSION_DENIED** (`isValidFeedStock` + `affectedKeys().hasOnly(...)`).
5. **Payload 5 (Ownership Transfer Attack on Update)**: Verified owner updates `/transactions/tx_1` changing `ownerId` from `"uid_1"` to `"uid_2"`. -> **Expected: PERMISSION_DENIED**.
6. **Payload 6 (Timestamp Forgery / Backdating)**: Verified owner creates `/sales/sale_1` with client timestamp `2020-01-01T00:00:00Z` instead of `request.time`. -> **Expected: PERMISSION_DENIED**.
7. **Payload 7 (Orphaned Operational Record Without FarmProfile)**: Verified user `uid_no_profile` attempts to create `/animals/anim_1` before `/farmProfiles/uid_no_profile` exists. -> **Expected: PERMISSION_DENIED**.
8. **Payload 8 (PII Cross-Tenant Read / Scrape)**: Verified user `uid_attacker` attempts `get` on `/farmProfiles/uid_victim` or `list` on `/farmProfiles`. -> **Expected: PERMISSION_DENIED**.
9. **Payload 9 (Unfiltered List Query Scraping)**: Verified user `uid_attacker` issues an unfiltered `list` query across `/sales` without `where('ownerId', '==', 'uid_attacker')`. -> **Expected: PERMISSION_DENIED**.
10. **Payload 10 (ID Poisoning / Oversized Path Variable)**: Verified user attempts `create` on `/animals/bad$id!with/slash` or >128 char ID. -> **Expected: PERMISSION_DENIED**.
11. **Payload 11 (Value Poisoning on Whitelisted Update Key)**: Verified owner updates `weightKg` on `/animals/anim_1` with string `"350kg"` or negative `-50`, or attempts to set `hasAppPassword: false` on `/farmProfiles/uid_owner`. -> **Expected: PERMISSION_DENIED**.
12. **Payload 12 (Financial Logic Corruption on SaleRecord)**: Verified owner creates `/sales/sale_1` where `paidAmount` exceeds `totalAmount` or `quantity <= 0`. -> **Expected: PERMISSION_DENIED**.
