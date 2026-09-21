export interface SuperAdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  type: 'SUPERADMIN';
}

export interface ProjectUserJwtPayload {
  sub: string;
  email: string;
  name: string;
  projectId: string;
  projectSlug: string;
  role: string;
  type: 'PROJECT_USER';
}

declare module 'fastify' {
  interface FastifyRequest {
    superAdmin?: SuperAdminJwtPayload;
    projectUser?: ProjectUserJwtPayload;
  }
}
