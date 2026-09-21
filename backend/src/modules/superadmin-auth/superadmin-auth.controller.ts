import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { SuperAdminJwtPayload } from '../../types/auth.js';

const registerInitialSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre es obligatorio'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export async function registerInitialSuperAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = registerInitialSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Datos de registro inválidos',
      details: parseResult.error.format(),
    });
  }

  const { email, password, name } = parseResult.data;

  // Check if any SuperAdmin already exists
  const count = await prisma.superAdmin.count();
  if (count > 0) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Ya existe un SuperAdmin maestro registrado. Usa el login correspondiente.',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.superAdmin.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const payload: SuperAdminJwtPayload = {
    sub: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    type: 'SUPERADMIN',
  };

  const token = jwt.sign(payload, env.SUPERADMIN_JWT_SECRET, { expiresIn: '7d' });

  return reply.status(201).send({
    message: 'SuperAdmin inicial creado exitosamente',
    token,
    user: superAdmin,
  });
}

export async function loginSuperAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = loginSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Credenciales inválidas',
      details: parseResult.error.format(),
    });
  }

  const { email, password } = parseResult.data;

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (!superAdmin) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Credenciales incorrectas.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
  if (!isPasswordValid) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Credenciales incorrectas.',
    });
  }

  const payload: SuperAdminJwtPayload = {
    sub: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    type: 'SUPERADMIN',
  };

  const token = jwt.sign(payload, env.SUPERADMIN_JWT_SECRET, { expiresIn: '7d' });

  return reply.send({
    message: 'Inicio de sesión maestro exitoso',
    token,
    user: {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      createdAt: superAdmin.createdAt,
    },
  });
}

export async function getSuperAdminMeHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.superAdmin) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: request.superAdmin.sub },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!superAdmin) {
    return reply.status(404).send({ error: 'SuperAdmin no encontrado' });
  }

  return reply.send({ user: superAdmin });
}
