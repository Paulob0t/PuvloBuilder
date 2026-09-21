# PuvloBuilder 🚀

Modular **Mini-CMS & Page-Builder Multi-Tenant** with dual-tier authentication and dynamic JSON block rendering.

---

## 🏗 Architecture Overview

```
PuvloBuilder/
├── backend/                  # Fastify + TypeScript + Prisma ORM
│   ├── prisma/
│   │   └── schema.prisma     # MariaDB models with JSON fields
│   └── src/
│       ├── config/           # Zod environment validation
│       ├── middlewares/      # Dual-tier auth guards & tenant isolation
│       ├── modules/
│       │   ├── superadmin-auth/  # Master control panel authentication
│       │   ├── project-auth/     # Per-project Sub-Admin / Tenant auth
│       │   └── projects/         # Dynamic block layout CRUD & public API
│       └── server.ts
│
└── frontend/                 # React (Vite) + TypeScript + Tailwind CSS
    └── src/
        ├── api/              # Axios client with multi-token interceptors
        ├── context/          # Dual-tier AuthProvider (SuperAdmin & ProjectUser)
        └── pages/
            ├── SuperAdminLogin.tsx
            ├── SuperAdminDashboard.tsx
            ├── ProjectUserLogin.tsx
            └── ProjectSiteView.tsx
```

---

## 🔑 Dual-Tier Auth System

1. **Master SuperAdmin**:
   - Access to global dashboard (`/login` -> `/admin`).
   - Create, edit, publish and delete mini-projects (`/sitio/:slug`).
   - Manage and preview dynamic JSON layout blocks.

2. **Project Sub-Admin / Tenant Users**:
   - Scoped authentication per project (`/sitio/:slug/login`).
   - Strict multi-tenant isolation (tokens bound to `projectId` and `projectSlug`).

---

## 🧩 Dynamic Block Engine

Pages are composed of dynamic JSON blocks persisted in MariaDB:
- `HERO`: Dynamic headline, subtitle, and CTA.
- `FEATURES`: Dynamic feature grid.
- `TEXT`, `CTA`, `FORM`: Extensible block registry.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Fastify, TypeScript, Prisma ORM, JWT, bcryptjs, Zod
- **Database**: MariaDB (Local)
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router DOM, Lucide Icons
