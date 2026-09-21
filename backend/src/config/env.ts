import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPERADMIN_JWT_SECRET: z.string().min(8, 'SUPERADMIN_JWT_SECRET must be at least 8 chars'),
  PROJECT_USER_JWT_SECRET: z.string().min(8, 'PROJECT_USER_JWT_SECRET must be at least 8 chars'),
});

export const env = envSchema.parse(process.env);
