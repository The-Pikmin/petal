<div align="center">
<img width="125" height="125" src="https://emojicdn.elk.sh/🌸?style=apple"/>
<h1>Petal - Plant Disease Diagnosis Frontend</h1>
</div>

> [!NOTE]
> This is the frontend application for the senior design project:
> "A07 - Computer Vision System for Plant Disease Diagnosis".

# Introduction

Petal is the frontend for the GreenEye plant disease diagnosis app. Built with SvelteKit 2 and Svelte 5, it provides a mobile-first UI for capturing plant photos, viewing AI-powered identification and disease analysis results, browsing scan history, and exploring a disease treatment library. The app runs as a web app and as a native mobile app via Capacitor.

# Features

- **Camera Capture** — Take or upload photos of plants directly in the app
- **Plant Identification** — AI-powered species identification with top-3 predictions and confidence scores
- **Disease Analysis** — Automated disease detection with severity assessment and confidence bars
- **Low Confidence Warning** — Alerts users when the model isn't confident (e.g. non-plant images)
- **Scan History** — Browse past scans with full detail view including treatment information
- **Disease Library** — Explore diseases by genus with symptoms, causes, treatment steps, and prevention tips
- **Real-time Stats** — Home page stats derived from actual scan data
- **Dark/Light Theme** — System-aware theme with manual toggle
- **Authentication** — Email/password, Google, and Apple sign-in via Supabase Auth
- **Weather Widget** — Local weather display on the home page
- **Profile Management** — Username editing, theme preferences, sign out

# Tech Stack

- **Framework:** [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Auth:** [Supabase](https://supabase.com/) (client-side auth, JWT sent to backend)
- **Mobile:** [Capacitor](https://capacitorjs.com/) for iOS/Android native builds
- **Icons:** [Lucide Svelte](https://lucide.dev/)
- **Linting:** ESLint with TypeScript rules
- **Type Checking:** svelte-check

# Pages / Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (marketing, redirects to home on native) |
| `/login` | Email/password + social login |
| `/signup` | Account registration |
| `/onboarding` | First-time user onboarding flow |
| `/home` | Dashboard with weather, stats, recent scans, daily tip |
| `/camera` | Camera capture / image upload |
| `/scan` | Scan results with predictions and disease analysis |
| `/history` | Scan history timeline |
| `/history/[id]` | Single scan detail with treatment info |
| `/library` | Disease library (filterable by genus, searchable) |
| `/library/[genus]/[disease]` | Disease detail with symptoms, causes, treatments, prevention |
| `/profile` | User profile and settings |

# Getting Started

1. Install [Node.js](https://nodejs.org/) (v18 or higher).

2. Navigate to the `petal/` directory.

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file:
```
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
PUBLIC_API_BASE_URL=http://localhost:8000/api
```

5. Start the development server:
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

# Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Run svelte-check (type checking) |
| `npm run lint` | Run ESLint |

# Contributing

We welcome contributions from the team! Please read our [Contributing Guide](./CONTRIBUTING.md) for the full workflow and standards.

## License

This repository is licensed under the [MIT License](./LICENSE).
