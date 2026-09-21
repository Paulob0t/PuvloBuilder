import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Layers,
  Users,
  ExternalLink,
  LogOut,
  Sparkles,
  Globe,
  Trash2,
  Lock,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Project {
  id: string;
  slug: string;
  title: string;
  description?: string;
  published: boolean;
  authEnabled: boolean;
  blocks: any[];
  _count: {
    users: number;
    submissions: number;
  };
  createdAt: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { superAdmin, logoutSuperAdmin } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New project form state
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthEnabled, setNewAuthEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch {
      // If unauthorized, redirect to login
      logoutSuperAdmin();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!superAdmin) {
      navigate('/login');
      return;
    }
    fetchProjects();
  }, [superAdmin]);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    // Auto-generate slug from title
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setNewSlug(generatedSlug);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      await api.post('/projects', {
        title: newTitle,
        slug: newSlug,
        description: newDescription,
        published: true,
        authEnabled: newAuthEnabled,
        blocks: [
          {
            id: 'b-' + Date.now(),
            type: 'HERO',
            content: {
              title: newTitle,
              subtitle: newDescription || 'Bienvenido a este nuevo mini-sitio modular.',
              ctaText: 'Comenzar ahora',
            },
          },
        ],
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      fetchProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear el proyecto');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar el proyecto "${title}"?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch {
      alert('Error al eliminar el proyecto.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">
                Puvlo<span className="text-indigo-400">Builder</span>
              </span>
              <span className="ml-2 text-xs bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-full font-medium">
                SuperAdmin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{superAdmin?.name}</div>
              <div className="text-xs text-slate-500">{superAdmin?.email}</div>
            </div>
            <button
              onClick={() => {
                logoutSuperAdmin();
                navigate('/login');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Mini Proyectos & Sub-Sitios</h2>
            <p className="text-sm text-slate-400 mt-1">
              Gestiona sitios multi-tenant, layouts dinámicos y accesos de sub-administradores.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/25 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Mini Proyecto</span>
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-3xl p-12 text-center bg-slate-900/20">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No hay proyectos creados aún</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Comienza creando tu primer mini-sitio con su propio slug y sistema de bloques dinámicos.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Crear mi primer proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          proj.published
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {proj.published ? 'Publicado' : 'Borrador'}
                      </span>
                      <button
                        onClick={() => handleDeleteProject(proj.id, proj.title)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base text-white group-hover:text-indigo-300 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-4">
                    {proj.description || 'Sin descripción'}
                  </p>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono flex items-center justify-between mb-4">
                    <span>/sitio/{proj.slug}</span>
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 py-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{proj._count?.users || 0} Sub-admins/users</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                      <span>{Array.isArray(proj.blocks) ? proj.blocks.length : 0} Bloques</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800/60 flex items-center gap-2">
                  <Link
                    to={`/sitio/${proj.slug}`}
                    target="_blank"
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-xl text-center font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ver Sitio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {proj.authEnabled && (
                    <Link
                      to={`/sitio/${proj.slug}/login`}
                      target="_blank"
                      className="bg-emerald-950/60 border border-emerald-800/50 hover:bg-emerald-900/60 text-emerald-300 text-xs py-2 px-3 rounded-xl font-medium flex items-center gap-1 transition-colors"
                      title="Login de Sub-Admin del sitio"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tenant Login</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear Proyecto */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Crear Nuevo Mini Proyecto</h3>
            <p className="text-xs text-slate-400 mb-6">
              El slug definirá la URL independiente de la sub-página.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Título del Proyecto
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej. Tienda de Zapatos"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Slug (URL identificador)
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-800 border border-r-0 border-slate-700 text-slate-400 px-3 py-2.5 rounded-l-xl text-xs">
                    /sitio/
                  </span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="tienda-zapatos"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-r-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Breve descripción del propósito de este mini sitio..."
                  rows={2}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="authEnabled"
                  checked={newAuthEnabled}
                  onChange={(e) => setNewAuthEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="authEnabled" className="text-xs text-slate-300 cursor-pointer">
                  Habilitar sistema de login propio para este sub-proyecto
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-medium shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
