import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, User, ArrowRight, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProjectUserLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { loginProjectUser } = useAuth();

  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingProject, setCheckingProject] = useState(true);

  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!slug) return;
      try {
        const res = await api.get(`/projects/public/${slug}`);
        setProjectTitle(res.data.project.title);
      } catch {
        setError(`El proyecto '${slug}' no fue encontrado.`);
      } finally {
        setCheckingProject(false);
      }
    };

    fetchProjectInfo();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegisterMode
        ? `/projects/${slug}/auth/register`
        : `/projects/${slug}/auth/login`;

      const payload = isRegisterMode ? { email, password, name, role: 'admin' } : { email, password };

      const res = await api.post(endpoint, payload);
      loginProjectUser(res.data.token, res.data.user);
      navigate(`/sitio/${slug}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error de autenticación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20 mb-4 ring-1 ring-white/20">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {projectTitle || slug}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isRegisterMode ? 'Crear cuenta en este sitio' : 'Acceso al panel del sitio'}
          </p>
          <div className="mt-2">
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              Tenant: /sitio/{slug}
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Subadmin"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@sitio.com"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Registrarse en el Sitio' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsRegisterMode(!isRegisterMode);
              }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isRegisterMode ? '¿Ya tienes cuenta? Ingresar' : 'Registrar nuevo usuario'}
            </button>

            <Link
              to={`/sitio/${slug}`}
              className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
            >
              Ver sitio público <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
