import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowRight, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  styles?: Record<string, any>;
}

interface ProjectData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  published: boolean;
  authEnabled: boolean;
  blocks: Block[];
  settings?: Record<string, any>;
}

export const ProjectSiteView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { projectUser, logoutProjectUser } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSite = async () => {
      try {
        const res = await api.get(`/projects/public/${slug}`);
        setProject(res.data.project);
      } catch (err: any) {
        setError(err.response?.data?.message || 'No se pudo cargar la página');
      } finally {
        setLoading(false);
      }
    };

    loadSite();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-400 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Página no encontrada</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">{error}</p>
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm underline">
          Ir al Login Principal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Site Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              {project.title.charAt(0)}
            </div>
            <span className="font-bold text-lg text-white">{project.title}</span>
          </div>

          <div className="flex items-center gap-3">
            {project.authEnabled && (
              <>
                {projectUser && projectUser.projectSlug === slug ? (
                  <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{projectUser.name} ({projectUser.role})</span>
                    <button
                      onClick={logoutProjectUser}
                      className="text-slate-400 hover:text-rose-400 ml-2 cursor-pointer"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <Link
                    to={`/sitio/${slug}/login`}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login del Sitio</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Blocks Renderer */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-16">
        {Array.isArray(project.blocks) && project.blocks.length > 0 ? (
          project.blocks.map((block) => (
            <section key={block.id} className="relative">
              {/* HERO BLOCK */}
              {block.type === 'HERO' && (
                <div className="text-center py-16 px-4 bg-gradient-to-b from-indigo-950/20 to-transparent border border-slate-800/60 rounded-3xl relative overflow-hidden">
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
                    {block.content.title || project.title}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mt-4">
                    {block.content.subtitle || project.description}
                  </p>
                  {block.content.ctaText && (
                    <button className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all cursor-pointer">
                      <span>{block.content.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* FEATURES BLOCK */}
              {block.type === 'FEATURES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(block.content.items) &&
                    block.content.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    ))}
                </div>
              )}
            </section>
          ))
        ) : (
          <div className="text-center py-20 text-slate-500">
            Este sitio aún no tiene bloques configurados.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        PuvloBuilder • Tenant: /sitio/{project.slug}
      </footer>
    </div>
  );
};
