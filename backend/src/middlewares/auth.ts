import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { SuperAdminJwtPayload, ProjectUserJwtPayload } from '../types/auth.js';

export async function authenticateSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token de SuperAdmin no proporcionado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.SUPERADMIN_JWT_SECRET) as SuperAdminJwtPayload;
    if (decoded.type !== 'SUPERADMIN') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Acceso no permitido: el token no corresponde a un SuperAdmin.',
      });
    }

    request.superAdmin = decoded;
  } catch (error) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token de SuperAdmin inválido o expirado.',
    });
  }
}

export function createProjectUserAuthMiddleware(options?: { requireAdminRole?: boolean }) {
  return async function authenticateProjectUser(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token de usuario de proyecto no proporcionado.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.PROJECT_USER_JWT_SECRET) as ProjectUserJwtPayload;
      if (decoded.type !== 'PROJECT_USER') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Acceso no permitido: el token no corresponde a un usuario de proyecto.',
        });
      }

      // Check tenant isolation if slug or projectId is passed in params
      const params = request.params as Record<string, string | undefined>;
      if (params?.slug && params.slug !== decoded.projectSlug) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Aislamiento multi-tenant: No tienes permiso para acceder a este proyecto.',
        });
      }

      if (params?.projectId && params.projectId !== decoded.projectId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Aislamiento multi-tenant: ID de proyecto no coincide con tu sesión.',
        });
      }

      if (options?.requireAdminRole && decoded.role !== 'admin') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Se requieren privilegios de sub-administrador del proyecto.',
        });
      }

      request.projectUser = decoded;
    } catch (error) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token de usuario de proyecto inválido o expirado.',
      });
    }
  };
}
