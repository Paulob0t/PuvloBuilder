import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

// Block definition schema
const blockSchema = z.object({
  id: z.string(),
  type: z.string(), // e.g. 'HERO', 'FEATURES', 'FORM', 'TEXT', 'CTA', etc.
  content: z.record(z.any()).default({}),
  styles: z.record(z.any()).optional().default({}),
});

const createProjectSchema = z.object({
  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones (-)'),
  routePrefix: z
    .string()
    .min(1, 'El prefijo de ruta es obligatorio')
    .regex(/^[a-z0-9-]+$/, 'El prefijo solo puede contener letras minúsculas, números y guiones (-)')
    .default('sitio'),
  title: z.string().min(2, 'El título es obligatorio'),
  description: z.string().optional(),
  published: z.boolean().default(false),
  authEnabled: z.boolean().default(false),
  blocks: z.array(blockSchema).default([]),
  settings: z.record(z.any()).optional().default({}),
});

const updateProjectSchema = createProjectSchema.partial().omit({ slug: true });

// 1. List all projects (SuperAdmin)
export async function listProjectsHandler(request: FastifyRequest, reply: FastifyReply) {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          users: true,
          submissions: true,
        },
      },
    },
  });

  return reply.send({ projects });
}

// 2. Create project (SuperAdmin)
export async function createProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = createProjectSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Datos de proyecto inválidos',
      details: parseResult.error.format(),
    });
  }

  const { slug, routePrefix, title, description, published, authEnabled, blocks, settings } = parseResult.data;

  const existingProject = await prisma.project.findUnique({
    where: { slug },
  });

  if (existingProject) {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: `Ya existe un proyecto con el slug '${slug}'.`,
    });
  }

  const project = await prisma.project.create({
    data: {
      slug,
      routePrefix: routePrefix || 'sitio',
      title,
      description,
      published,
      authEnabled,
      blocks: blocks as any,
      settings: settings as any,
    },
  });

  return reply.status(201).send({
    message: 'Proyecto creado exitosamente',
    project,
  });
}

// 3. Get project by ID (SuperAdmin)
export async function getProjectByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!project) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Proyecto no encontrado',
    });
  }

  return reply.send({ project });
}

// 4. Update project (SuperAdmin or Sub-Admin of project)
export async function updateProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parseResult = updateProjectSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Datos de actualización inválidos',
      details: parseResult.error.format(),
    });
  }

  const existingProject = await prisma.project.findUnique({
    where: { id },
  });

  if (!existingProject) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Proyecto no encontrado',
    });
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      ...parseResult.data,
      blocks: parseResult.data.blocks !== undefined ? (parseResult.data.blocks as any) : undefined,
      settings: parseResult.data.settings !== undefined ? (parseResult.data.settings as any) : undefined,
    },
  });

  return reply.send({
    message: 'Proyecto actualizado correctamente',
    project: updatedProject,
  });
}

// 5. Delete project (SuperAdmin)
export async function deleteProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const existingProject = await prisma.project.findUnique({
    where: { id },
  });

  if (!existingProject) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Proyecto no encontrado',
    });
  }

  await prisma.project.delete({
    where: { id },
  });

  return reply.send({
    message: 'Proyecto eliminado exitosamente',
  });
}

// 6. Public: Get published project layout by SLUG (For Frontend Page Builder rendering)
export async function getPublicProjectBySlugHandler(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      routePrefix: true,
      title: true,
      description: true,
      published: true,
      authEnabled: true,
      blocks: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!project) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `El proyecto '${slug}' no existe.`,
    });
  }

  return reply.send({ project });
}
