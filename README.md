# AsaanRabta Admin (admin2)

Production platform-admin dashboard — Tailwick UI/UX with the full functionality migrated from the legacy `admin/` app.

## Stack

- Vite 7 + React 19 + TypeScript (strict)
- Tailwind CSS v4 (CSS-first tokens in `src/assets/css/themes.css`; brand green `--color-primary`)
- TanStack Query (all server state) · axios (`src/lib/apiClient.ts`, httpOnly-cookie auth + silent refresh)
- React Hook Form + Zod (all forms; schemas in `src/features/<module>/types.ts`)
- TanStack Table behind `src/components/table/DataTable.tsx`
- ApexCharts (theme-reactive via `useChartColors`) · react-icons (Lu\*) · sonner toasts
- Preline only for static chrome (sidenav accordion, topbar dropdowns, customizer); all data-driven overlays are React-controlled (`src/components/overlays/`)

## Develop

```bash
yarn install        # yarn berry, nodeLinker: node-modules
yarn dev            # http://localhost:5174 (backend proxied at /api → :5000)
yarn lint && yarn build
```

Env (`.env`, see `.env.example`):

- `VITE_API_URL` — empty in dev (Vite proxies `/api`); backend origin in production.
- `VITE_API_PROXY` — dev proxy target, default `http://localhost:5000`.

Production note: the server's `ADMIN_ORIGIN` env must be set to this app's deployed origin (CORS + cookies).

## Layout

```
src/
├── app/            # Thin route pages (PageMeta + feature view)
├── components/     # Shared UI (DataTable, Modal, Dropdown, forms, badges, states…)
├── features/<x>/   # <x>.api.ts · <x>.hooks.ts · types.ts · components/
├── layouts/        # AdminLayout (auth guard + chrome, mounted once)
├── lib/            # apiClient, types, formatters, statusTones, useDebounce
├── routes/         # Real routes + dev-only /mock/* routes
└── mock/           # Tailwick demo pages (reference only; excluded from lint/build)
```

The original Tailwick demo pages live in `src/mock/` and are browsable in dev under `/mock/*` (e.g. `/mock/orders`); they are statically stripped from production builds. Delete the folder (and prune its deps: fullcalendar, swiper, react-countdown, lucide-react, @iconify/react, react-router-dom) once no longer needed as reference.
# crm-admin-v1
