import { FastifyInstance } from 'fastify';
import {
  listProjectsHandler,
  createProjectHandler,
  getProjectByIdHandler,
  updateProjectHandler,
  deleteProjectHandler,
  getPublicProjectBySlugHandler,
} from './project.controller.js';
import { authenticateSuperAdmin } from '../../middlewares/auth.js';

export async function projectRoutes(fastify: FastifyInstance) {
  // Public endpoint to load a site/page by its slug
  fastify.get('/public/:slug', getPublicProjectBySlugHandler);

  // SuperAdmin protected management endpoints
  fastify.get('/', { preHandler: [authenticateSuperAdmin] }, listProjectsHandler);
  fastify.post('/', { preHandler: [authenticateSuperAdmin] }, createProjectHandler);
  fastify.get('/:id', { preHandler: [authenticateSuperAdmin] }, getProjectByIdHandler);
  fastify.put('/:id', { preHandler: [authenticateSuperAdmin] }, updateProjectHandler);
  fastify.delete('/:id', { preHandler: [authenticateSuperAdmin] }, deleteProjectHandler);
}
