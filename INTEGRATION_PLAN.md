# Petal → Stamen Integration Plan

## Overview

Connect the Petal frontend (Svelte 5 + SvelteKit + Capacitor) to the Stamen backend (Django + DRF) hosted at `https://stamen.onrender.com/api/`.

Currently Lotus (ML) only returns **plant species identification** (not disease diagnosis) — the disease sub-models are still in development. So the integration focuses on: **auth, image upload, and species ID**.

---

## Backend API Contract (Stamen `dev` branch)

All endpoints prefixed with `/api/`.

| Endpoint              | Method | Auth   | Request                            | Response                                                     |
| --------------------- | ------ | ------ | ---------------------------------- | ------------------------------------------------------------ |
| `/api/register/`      | POST   | None   | `{username, email, password}`      | `{access, refresh}` (201)                                    |
| `/api/login/`         | POST   | None   | `{username, password}`             | `{access, refresh}` (200)                                    |
| `/api/me/`            | GET    | Bearer | —                                  | `{id, username, email}` (200)                                |
| `/api/token/refresh/` | POST   | None   | `{refresh}`                        | `{access, refresh}` (200)                                    |
| `/api/images/upload/` | POST   | Bearer | `multipart/form-data` with `image` | `{id, supabase_path, uploaded_at, url}` (201)                |
| `/api/predict/`       | POST   | Bearer | `{image_url}`                      | `{predictions: [{species_id, name, confidence}, ...]}` (200) |

**JWT settings:** Access token = 60 min, Refresh token = 7 days, `ROTATE_REFRESH_TOKENS: True`, `BLACKLIST_AFTER_ROTATION: True`.

---

## Dependency Graph

```
Phase 1: Foundation (.env, types, API client)        — no dependencies
    ↓
Phase 2: Auth (store, layout init, route guards)      — depends on Phase 1
    ↓
Phase 3: Auth Pages (login, signup)                   — depends on Phase 2
    ↓
Phase 4: Scan Flow (upload + predict service, new UI) — depends on Phase 2
    ↓
Phase 5: Profile, Home, History (wire to real data)   — depends on Phase 2
```

---

## Phase 1: Foundation

### 1.1 — Environment Config

- [ ] Create `petal/.env` with `PUBLIC_API_URL=https://stamen.onrender.com/api`
- [ ] Create `petal/.env.example` as template for other devs
- [ ] Modify `src/app.d.ts` to declare `ImportMetaEnv` with `PUBLIC_API_URL`

### 1.2 — API Types

- [ ] Create `src/lib/types/api.types.ts` with:
    - `LoginRequest` — `{ username, password }`
    - `RegisterRequest` — `{ username, email, password }`
    - `AuthTokens` — `{ access, refresh }`
    - `ApiUser` — `{ id, username, email }`
    - `ImageUploadResponse` — `{ id, supabase_path, uploaded_at, url }`
    - `SpeciesPrediction` — `{ species_id, name, confidence }`
    - `PredictResponse` — `{ predictions: SpeciesPrediction[] }`
    - `PlantIDResult` — `{ imageUrl, predictions, timestamp }`
    - `ApiError` — `{ error?, detail?, [key]: unknown }`

### 1.3 — API Client

- [ ] Create `src/lib/services/api.ts` with:
    - Token storage helpers (`getStoredTokens`, `setStoredTokens`, `clearStoredTokens`) using `localStorage`
    - `apiFetch<T>(endpoint, options)` — generic wrapper with:
        - Auto `Authorization: Bearer <token>` header injection
        - Auto `Content-Type: application/json` (unless `FormData`)
        - 401 handling: attempt token refresh via `POST /token/refresh/`, retry once
        - Refresh deduplication via singleton promise (critical for rotated tokens)
        - Longer timeout support for Render cold starts

---

## Phase 2: Auth

### 2.1 — Auth Store

- [ ] Create `src/lib/stores/auth.store.ts` with:
    - State: `{ user: ApiUser | null, tokens: AuthTokens | null, initialized: boolean }`
    - `initialize()` — hydrate from `localStorage`, validate via `GET /me/`
    - `login(username, password)` — `POST /login/`, store tokens, fetch profile
    - `register(username, email, password)` — `POST /register/`, store tokens, fetch profile
    - `logout()` — clear tokens, reset state
    - Derived stores: `isAuthenticated`, `currentUser`, `authInitialized`

### 2.2 — Layout Auth Init

- [ ] Modify `src/routes/+layout.svelte` — call `auth.initialize()` in `onMount`

### 2.3 — Route Guards

- [ ] Create `src/lib/guards/auth.guard.ts` with:
    - `requireAuth()` — redirect to `/login` if not authenticated
    - `requireGuest()` — redirect to `/home` if already authenticated

---

## Phase 3: Auth Pages

### 3.1 — Login Page

- [ ] Modify `src/routes/login/+page.svelte`:
    - Change email field → username field (type `text`, `User` icon)
    - Replace mock `setTimeout` with `auth.login(username, password)`
    - Add error message display (invalid creds, network errors)
    - Add `requireGuest()` guard

### 3.2 — Signup Page

- [ ] Modify `src/routes/signup/+page.svelte`:
    - Change "Full Name" → "Username"
    - Replace mock with `auth.register(username, email, password)`
    - Add error message display (duplicate user, validation)
    - Add password hint ("Must be at least 8 characters")
    - Add `requireGuest()` guard

---

## Phase 4: Scan Flow

### 4.1 — Scan Service

- [ ] Create `src/lib/services/scan.service.ts` with:
    - `base64ToFile(photo)` — convert `CapturedPhoto` base64 to `File` for `FormData`
    - `identifyPlant(photo)` — chain upload + predict:
        1. `POST /images/upload/` with image as `FormData`
        2. `POST /predict/` with `{ image_url: uploadResponse.url }`
        3. Return `PlantIDResult`

### 4.2 — Scan Page

- [ ] Modify `src/routes/scan/+page.svelte`:
    - Replace `generateMockDiagnosis()` with `identifyPlant(photo)`
    - New species results UI (top match + alternatives with confidence bars)
    - Add error state for failed analysis
    - Remove disease-specific UI (severity, treatments, flag modal)
    - Keep "Save to History" (sessionStorage for now) and "Scan Again"
    - Add `requireAuth()` guard

---

## Phase 5: Remaining Pages

### 5.1 — Profile

- [ ] Modify `src/routes/profile/+page.svelte`:
    - Replace `mockUserProfile` with `$currentUser` from auth store
    - Wire "Sign Out" button → `auth.logout()` → `goto('/login')`
    - Stats stay as placeholder (no backend endpoint yet)
    - Add `requireAuth()` guard

### 5.2 — Home

- [ ] Modify `src/routes/home/+page.svelte`:
    - Replace "Gardener" greeting with `$currentUser?.username || 'Gardener'`
    - Stats stay as mock data
    - Weather service unchanged
    - Add `requireAuth()` guard

### 5.3 — History

- [ ] Modify `src/routes/history/+page.svelte`:
    - Update display for species results (name + confidence) instead of disease
    - Keep `sessionStorage` (backend history endpoints not ready)
    - Remove `mockScanHistory` dependency
    - Add `requireAuth()` guard

### 5.4 — Camera & Library

- [ ] Add `requireAuth()` guard to `camera/+page.svelte` and `library/+page.svelte`

---

## Files Summary

### New Files (7)

| File                               | Purpose               |
| ---------------------------------- | --------------------- |
| `petal/.env`                       | API URL config        |
| `petal/.env.example`               | Template for devs     |
| `src/lib/types/api.types.ts`       | API type definitions  |
| `src/lib/services/api.ts`          | Fetch wrapper + JWT   |
| `src/lib/stores/auth.store.ts`     | Auth state management |
| `src/lib/guards/auth.guard.ts`     | Route protection      |
| `src/lib/services/scan.service.ts` | Upload + predict      |

### Modified Files (9)

| File                              | Changes                         |
| --------------------------------- | ------------------------------- |
| `src/app.d.ts`                    | Env var types                   |
| `src/routes/+layout.svelte`       | Auth init                       |
| `src/routes/login/+page.svelte`   | Real auth, email → username     |
| `src/routes/signup/+page.svelte`  | Real auth, name → username      |
| `src/routes/scan/+page.svelte`    | Real upload+predict, species UI |
| `src/routes/profile/+page.svelte` | Real user data, sign out        |
| `src/routes/home/+page.svelte`    | Real username, auth guard       |
| `src/routes/history/+page.svelte` | Species display, auth guard     |
| `src/routes/camera/+page.svelte`  | Auth guard                      |

---

## Known Risks & Mitigations

| Risk                              | Mitigation                                           |
| --------------------------------- | ---------------------------------------------------- |
| Render cold start (30-60s delay)  | Longer timeout in API client + loading state in UI   |
| Refresh token used twice → logout | Deduplication singleton prevents concurrent refresh  |
| Large base64 in sessionStorage    | Existing design; optimize with IndexedDB later       |
| Supabase signed URLs expire (1hr) | Only matters for future history; regenerate on fetch |
| No password confirm on backend    | Client-side validation before submit                 |
| Generic uniqueness error          | Acceptable for now; backend can improve later        |

---

## Backend-Side Prerequisites

- [ ] Stamen CORS: `FRONTEND_URL` must include Petal's dev origin (`http://localhost:5173`) and deployed URL
- [ ] Verify Render deployment is running the `dev` branch code (Django, not Flask)
