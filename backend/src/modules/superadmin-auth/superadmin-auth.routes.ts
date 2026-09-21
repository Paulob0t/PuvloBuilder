import { FastifyInstance } from 'fastify';
import {
  registerInitialSuperAdminHandler,
  loginSuperAdminHandler,
  getSuperAdminMeHandler,
} from './superadmin-auth.controller.js';
import { authenticateSuperAdmin } from '../../middlewares/auth.js';

export async function superAdminAuthRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register-initial', registerInitialSuperAdminHandler);
  fastify.post('/login', loginSuperAdminHandler);

  // Protected route
  fastify.get('/me', { preHandler: [authenticateSuperAdmin] }, getSuperAdminMeHandler);
}
