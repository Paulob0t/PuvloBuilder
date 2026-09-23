import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fs from 'fs/promises';
import { env } from './config/env.js';
import { superAdminAuthRoutes } from './modules/superadmin-auth/superadmin-auth.routes.js';
import { projectAuthRoutes } from './modules/project-auth/project-auth.routes.js';
import { projectRoutes } from './modules/projects/project.routes.js';
import { prisma } from './lib/prisma.js';
import { STORAGE_ROOT, syncAllTenantWorkspaces } from './services/tenant-storage.service.js';

const fastify = Fastify({
  logger: {
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
});

async function main() {
  // Ensure storage root directory exists
  await fs.mkdir(STORAGE_ROOT, { recursive: true });

  // 1. Plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Serve tenant uploads and assets publicly
  await fastify.register(fastifyStatic, {
    root: STORAGE_ROOT,
    prefix: '/storage/tenants/',
    decorateReply: false,
  });

  // 2. Health check
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // 3. Register Modules
  // SuperAdmin Master Auth (/api/superadmin/auth)
  await fastify.register(superAdminAuthRoutes, { prefix: '/api/superadmin/auth' });

  // Project Tenant Auth (/api/projects/:slug/auth)
  await fastify.register(projectAuthRoutes, { prefix: '/api/projects/:slug/auth' });

  // Projects Management & Public Renderer (/api/projects)
  await fastify.register(projectRoutes, { prefix: '/api/projects' });

  // 4. Global Error Handler
  fastify.setErrorHandler((error: any, request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Internal Server Error',
      message: error.message || 'Ocurrió un error inesperado en el servidor.',
    });
  });

  // 5. Start server and sync physical workspaces
  try {
    await fastify.listen({ port: env.PORT, host: env.HOST });
    console.log(`\n🚀 [PuvloBuilder API] Servidor corriendo en http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`);
    console.log(`   - Master SuperAdmin Auth:    /api/superadmin/auth`);
    console.log(`   - Tenant / Sub-Admin Auth:   /api/projects/:slug/auth`);
    console.log(`   - Projects & Dynamic Blocks: /api/projects`);
    console.log(`   - Tenant Storage Workspace:  /storage/tenants/\n`);

    // Sync physical folders for existing projects
    await syncAllTenantWorkspaces();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\nCerrando servidor por señal ${signal}...`);
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
  });
});

main();
