import { FastifyInstance } from 'fastify';
import {
  registerProjectUserHandler,
  loginProjectUserHandler,
  getProjectUserMeHandler,
} from './project-auth.controller.js';
import { createProjectUserAuthMiddleware } from '../../middlewares/auth.js';

export async function projectAuthRoutes(fastify: FastifyInstance) {
  // Public routes scoped to project slug
  fastify.post('/register', registerProjectUserHandler);
  fastify.post('/login', loginProjectUserHandler);

  // Protected route scoped to project slug
  fastify.get('/me', { preHandler: [createProjectUserAuthMiddleware()] }, getProjectUserMeHandler);
}
