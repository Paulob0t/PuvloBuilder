# PuvloBuilder 🚀

**Mini-CMS y Page-Builder Modular Multi-Tenant** con arquitectura de autenticación de dos niveles y renderizado dinámico de bloques mediante campos JSON en MariaDB.

---

## 🏗 Vista General de la Arquitectura

```
PuvloBuilder/
├── backend/                  # Node.js + Fastify + TypeScript + Prisma ORM
│   ├── prisma/
│   │   └── schema.prisma     # Modelos en MariaDB con soporte de campos JSON
│   └── src/
│       ├── config/           # Validación de variables de entorno con Zod
│       ├── middlewares/      # Guards de autenticación de 2 niveles y aislamiento de tenants
│       ├── modules/
│       │   ├── superadmin-auth/  # Autenticación del panel de control maestro
│       │   ├── project-auth/     # Autenticación de Sub-Admins y usuarios por proyecto (:slug)
│       │   └── projects/         # CRUD de layouts de bloques JSON y API pública
│       └── server.ts         # Servidor Fastify con CORS y graceful shutdown
│
└── frontend/                 # React 19 (Vite) + TypeScript + Tailwind CSS v4
    └── src/
        ├── api/              # Cliente Axios con interceptores multi-token
        ├── context/          # AuthProvider con soporte para sesiones SuperAdmin y Tenant
        └── pages/
            ├── SuperAdminLogin.tsx       # Login maestro con tarjeta Glassmorphism
            ├── SuperAdminDashboard.tsx   # Panel de control de proyectos y métricas
            ├── ProjectUserLogin.tsx      # Login independiente por sub-sitio (/sitio/:slug/login)
            └── ProjectSiteView.tsx       # Renderizador dinámico de bloques (/sitio/:slug)
```

---

## 🔑 Sistema de Autenticación de Dos Niveles (Dual-Tier Auth)

1. **SuperAdmin Maestro**:
   - Acceso al panel de control global (`/login` -> `/admin`).
   - Crear, editar, publicar y eliminar mini-proyectos (`/sitio/:slug`).
   - Gestionar y previsualizar bloques de layout almacenados en JSON.

2. **Sub-Admins y Usuarios por Proyecto (Multi-Tenant)**:
   - Autenticación con alcance (*scoped*) por proyecto (`/sitio/:slug/login`).
   - Aislamiento estricto entre tenants (tokens JWT vinculados al `projectId` y `projectSlug`).

---

## 🧩 Motor Dinámico de Bloques (Page Builder)

Las páginas de cada mini-proyecto se componen mediante bloques estructurados en formato JSON dentro de MariaDB:
- `HERO`: Título, subtítulo y llamada a la acción (CTA) personalizables.
- `FEATURES`: Cuadrícula responsiva de características y servicios.
- `TEXT`, `CTA`, `FORM`: Bloques extensibles para formularios y contenido.

---

## 🛠 Stack Tecnológico

- **Backend**: Node.js, Fastify, TypeScript, Prisma ORM, JWT, bcryptjs, Zod
- **Base de datos**: MariaDB (local)
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router DOM, Lucide Icons

---

## 🚀 Puesta en Marcha

### 1. Requisitos Previos
- Node.js (v20+)
- MariaDB activo localmente

### 2. Configuración de la Base de Datos
```bash
# Crear base de datos y usuario local
sudo mariadb -e "CREATE DATABASE IF NOT EXISTS minicms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'minicms_user'@'localhost' IDENTIFIED BY '23010'; GRANT ALL PRIVILEGES ON minicms_db.* TO 'minicms_user'@'localhost'; FLUSH PRIVILEGES;"
```

### 3. Iniciar Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
*Servidor API disponible en:* `http://localhost:4000`

### 4. Iniciar Frontend
```bash
cd frontend
npm install
npm run dev
```
*Aplicación web disponible en:* `http://localhost:3000`
