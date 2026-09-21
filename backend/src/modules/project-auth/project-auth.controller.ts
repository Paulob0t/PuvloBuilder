import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { ProjectUserJwtPayload } from '../../types/auth.js';

const registerProjectUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre es obligatorio'),
  role: z.enum(['admin', 'editor', 'user']).default('admin'),
  metadata: z.record(z.any()).optional(),
});

const loginProjectUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export async function registerProjectUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };
  const parseResult = registerProjectUserSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Datos de registro de usuario inválidos',
      details: parseResult.error.format(),
    });
  }

  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `El proyecto '${slug}' no existe.`,
    });
  }

  const { email, password, name, role, metadata } = parseResult.data;

  // Check if user already exists IN THIS SPECIFIC PROJECT
  const existingUser = await prisma.projectUser.findUnique({
    where: {
      projectId_email: {
        projectId: project.id,
        email,
      },
    },
  });

  if (existingUser) {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: `El usuario ya está registrado en este proyecto.`,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.projectUser.create({
    data: {
      projectId: project.id,
      email,
      password: hashedPassword,
      name,
      role,
      metadata: metadata ?? undefined,
    },
    select: {
      id: true,
      projectId: true,
      email: true,
      name: true,
      role: true,
      metadata: true,
      createdAt: true,
    },
  });

  const payload: ProjectUserJwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    projectId: project.id,
    projectSlug: project.slug,
    role: user.role,
    type: 'PROJECT_USER',
  };

  const token = jwt.sign(payload, env.PROJECT_USER_JWT_SECRET, { expiresIn: '7d' });

  return reply.status(201).send({
    message: `Usuario registrado exitosamente en el proyecto '${project.title}'`,
    token,
    user,
    project: {
      id: project.id,
      slug: project.slug,
      routePrefix: project.routePrefix,
      title: project.title,
    },
  });
}

export async function loginProjectUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };
  const parseResult = loginProjectUserSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Credenciales inválidas',
      details: parseResult.error.format(),
    });
  }

  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `El proyecto '${slug}' no existe.`,
    });
  }

  const { email, password } = parseResult.data;

  const user = await prisma.projectUser.findUnique({
    where: {
      projectId_email: {
        projectId: project.id,
        email,
      },
    },
  });

  if (!user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Credenciales incorrectas para este proyecto.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Credenciales incorrectas para este proyecto.',
    });
  }

  const payload: ProjectUserJwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    projectId: project.id,
    projectSlug: project.slug,
    role: user.role,
    type: 'PROJECT_USER',
  };

  const token = jwt.sign(payload, env.PROJECT_USER_JWT_SECRET, { expiresIn: '7d' });

  return reply.send({
    message: `Inicio de sesión exitoso en '${project.title}'`,
    token,
    user: {
      id: user.id,
      projectId: user.projectId,
      email: user.email,
      name: user.name,
      role: user.role,
      metadata: user.metadata,
      createdAt: user.createdAt,
    },
    project: {
      id: project.id,
      slug: project.slug,
      routePrefix: project.routePrefix,
      title: project.title,
    },
  });
}

export async function getProjectUserMeHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.projectUser) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const user = await prisma.projectUser.findUnique({
    where: { id: request.projectUser.sub },
    include: {
      project: {
        select: {
          id: true,
          slug: true,
          routePrefix: true,
          title: true,
          authEnabled: true,
          published: true,
        },
      },
    },
  });

  if (!user) {
    return reply.status(404).send({ error: 'Usuario no encontrado' });
  }

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      metadata: user.metadata,
      createdAt: user.createdAt,
      project: user.project,
    },
  });
}
