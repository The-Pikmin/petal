<div align="center">
<img width="125" height="125" src="https://emojicdn.elk.sh/🌸?style=apple"/>
<h1>Petal - Plant Disease Diagnosis Frontend</h1>
</div>

> [!NOTE]
> This is the frontend application for the senior design project:
> "A07 - Computer Vision System for Plant Disease Diagnosis".

# Introduction

Petal is the GreenEye frontend. Built with SvelteKit 2 and Svelte 5, it provides a mobile-first experience for capturing plant photos, reviewing AI-powered identification results, browsing scan history, exploring the disease library, and managing account/profile settings. The app runs as a web app and as a native mobile app via Capacitor.

# Features

- **Camera Capture** — Take or upload photos of plants directly in the app
- **Detection-Guided Camera UX** — On-device plant detection, animated guide states, lock-and-hold auto-capture, and non-blocking plant warnings before analysis
- **Review Before Analysis** — Captured and gallery-selected images route through a confirmation screen before upload/inference
- **Plant Identification** — AI-powered species identification with top predictions and confidence scores
- **Disease Analysis** — Automated disease detection with severity assessment and confidence bars
- **Low Confidence Warning** — Alerts users when the model isn't confident or when the captured image does not appear plant-like
- **Scan History** — Browse past scans with full detail view including treatment information, thumbnail loading, and client-side cache reuse
- **Disease Library** — Explore diseases by genus with symptoms, causes, treatment steps, and prevention tips
- **Real-time Stats** — Home page stats derived from actual scan data
- **Theme Sync** — Light, dark, or auto theme persisted locally and synced through the backend profile API
- **Authentication** — Email/password, Google, and Apple sign-in via Supabase Auth
- **Weather Widget** — Local weather display on the home page
- **Profile Management** — Username/display-name editing, profile photo upload/removal, persisted preferences, password update, and sign out

# Tech Stack

- **Framework:** [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Auth:** [Supabase](https://supabase.com/) (client-side auth, JWT sent to backend)
- **Mobile:** [Capacitor](https://capacitorjs.com/) for iOS/Android native builds
- **Client ML:** TensorFlow.js + MobileNet heuristic for plant-presence guidance in the camera flow
- **Icons:** [Lucide Svelte](https://lucide.dev/)
- **Linting:** ESLint with TypeScript rules
- **Type Checking:** svelte-check

# Pages / Routes

| Route                        | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `/`                          | Landing page (marketing, redirects to home on native)        |
| `/login`                     | Email/password + social login                                |
| `/signup`                    | Account registration                                         |
| `/onboarding`                | First-time user onboarding flow                              |
| `/home`                      | Dashboard with weather, stats, recent scans, daily tip       |
| `/camera`                    | Detection-guided camera capture / image upload               |
| `/scan`                      | Review and confirm a photo before analysis, then view results |
| `/history`                   | Scan history timeline                                        |
| `/history/[id]`              | Single scan detail with treatment info                       |
| `/library`                   | Disease library (filterable by genus, searchable)            |
| `/library/[genus]/[disease]` | Disease detail with symptoms, causes, treatments, prevention |
| `/profile`                   | User profile, password, privacy, notifications, and theme    |

# Getting Started

1. Install [Node.js](https://nodejs.org/) (v18 or higher) and [`pnpm`](https://pnpm.io/).

2. Navigate to the `petal/` directory.

3. Install dependencies:

```bash
pnpm install
```

4. Create a `.env` file:

```
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
PUBLIC_API_URL=http://localhost:8000/api
```

5. Start the development server:

```bash
pnpm dev
```

Open http://localhost:5173 in your browser.

# Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build, checks, formatting, and Capacitor sync |
| `pnpm preview` | Preview production build |
| `pnpm check` | Run svelte-check |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm cap:sync` | Sync web assets into native iOS/Android projects |

## Current Camera Flow

1. The user opens `/camera`.
2. A lightweight on-device detector guides framing with `Searching`, `Detecting`, and `Locked` states.
3. If framing stays stable long enough, auto-capture fires; the manual shutter is always available as a fallback.
4. The captured or selected image routes to `/scan`.
5. `/scan` shows a confirmation screen, warns if the image does not appear plant-like, and only uploads/analyzes after explicit confirmation.

# Contributing

We welcome contributions from the team! Please read our [Contributing Guide](./CONTRIBUTING.md) for the full workflow and standards.

## License

This repository is licensed under the [MIT License](./LICENSE).
