import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root storage directory for all tenant workspaces
export const STORAGE_ROOT = path.resolve(__dirname, '../../storage/tenants');

/**
 * Returns the absolute directory path for a tenant project workspace
 */
export function getTenantWorkspacePath(routePrefix: string, slug: string): string {
  const safePrefix = routePrefix.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'sitio';
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return path.join(STORAGE_ROOT, safePrefix, safeSlug);
}

/**
 * Creates the isolated physical folder structure for a tenant project
 */
export async function createTenantWorkspace(routePrefix: string, slug: string, projectData: any): Promise<string> {
  const tenantDir = getTenantWorkspacePath(routePrefix, slug);
  const uploadsDir = path.join(tenantDir, 'uploads');
  const assetsDir = path.join(tenantDir, 'assets');
  const exportsDir = path.join(tenantDir, 'exports');

  // 1. Create directory tree
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(exportsDir, { recursive: true });

  // 2. Write snapshot configuration
  const configFile = path.join(tenantDir, 'config.json');
  const snapshot = {
    id: projectData.id,
    title: projectData.title,
    slug: projectData.slug,
    routePrefix: projectData.routePrefix || routePrefix,
    description: projectData.description || '',
    published: projectData.published ?? true,
    authEnabled: projectData.authEnabled ?? false,
    blocks: projectData.blocks || [],
    settings: projectData.settings || {},
    createdAt: projectData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(configFile, JSON.stringify(snapshot, null, 2), 'utf-8');

  // 3. Write informational README in tenant folder
  const readmeFile = path.join(tenantDir, 'README.md');
  const readmeContent = `# Workspace: ${projectData.title}

- **Ruta Web**: /${routePrefix}/${slug}
- **Slug**: ${slug}
- **ID de Base de Datos**: ${projectData.id}
- **Creado el**: ${snapshot.createdAt}

## Estructura de Carpetas:
- \`uploads/\`: Archivos e imágenes exclusivas de este sitio.
- \`assets/\`: Estilos CSS, iconos o scripts personalizados.
- \`exports/\`: Paquetes y exportaciones estáticas del proyecto.
- \`config.json\`: Respaldo del layout de bloques sincronizado con MariaDB.
`;
  await fs.writeFile(readmeFile, readmeContent, 'utf-8');

  console.log(`📁 [Tenant Storage] Workspace físico creado en: ${tenantDir}`);
  return tenantDir;
}

/**
 * Updates the config.json snapshot when project blocks or settings change
 */
export async function updateTenantWorkspace(routePrefix: string, slug: string, projectData: any): Promise<void> {
  const tenantDir = getTenantWorkspacePath(routePrefix, slug);
  const configFile = path.join(tenantDir, 'config.json');

  try {
    // Ensure directory exists
    await fs.mkdir(tenantDir, { recursive: true });

    const snapshot = {
      id: projectData.id,
      title: projectData.title,
      slug: projectData.slug,
      routePrefix: projectData.routePrefix || routePrefix,
      description: projectData.description || '',
      published: projectData.published ?? true,
      authEnabled: projectData.authEnabled ?? false,
      blocks: projectData.blocks || [],
      settings: projectData.settings || {},
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(configFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`🔄 [Tenant Storage] config.json sincronizado para: /${routePrefix}/${slug}`);
  } catch (error) {
    console.error(`⚠️ [Tenant Storage] Error al actualizar workspace:`, error);
  }
}

/**
 * Safely removes the tenant's physical folder when the project is deleted
 */
export async function deleteTenantWorkspace(routePrefix: string, slug: string): Promise<void> {
  const tenantDir = getTenantWorkspacePath(routePrefix, slug);
  try {
    await fs.rm(tenantDir, { recursive: true, force: true });
    console.log(`🗑️ [Tenant Storage] Workspace físico eliminado: ${tenantDir}`);
  } catch (error) {
    console.error(`⚠️ [Tenant Storage] Error al eliminar workspace ${tenantDir}:`, error);
  }
}

/**
 * Scans MariaDB and creates missing physical workspaces for existing projects
 */
export async function syncAllTenantWorkspaces(): Promise<void> {
  try {
    const projects = await prisma.project.findMany();
    for (const proj of projects) {
      const tenantDir = getTenantWorkspacePath(proj.routePrefix, proj.slug);
      const exists = await fs.access(tenantDir).then(() => true).catch(() => false);
      if (!exists) {
        await createTenantWorkspace(proj.routePrefix, proj.slug, proj);
      }
    }
  } catch (error) {
    console.error(`⚠️ [Tenant Storage] Error durante la sincronización inicial:`, error);
  }
}
