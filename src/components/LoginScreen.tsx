import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Users,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  onOpenCustomerPortal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  onOpenCustomerPortal
}) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedUserForForgot, setSelectedUserForForgot] = useState<AppUser | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const term = emailOrUser.trim().toLowerCase();
    if (!term) {
      setError('Por favor ingrese su email o nombre de usuario.');
      return;
    }

    if (!password) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    // Find user by email or name
    const found = users.find(u => 
      u.email.toLowerCase() === term || 
      u.name.toLowerCase().includes(term) ||
      u.role.toLowerCase() === term
    );

    if (!found) {
      setError('Usuario o email no registrado en el sistema de la fábrica.');
      return;
    }

    if (!found.active) {
      setError('El usuario se encuentra inactivo. Comuníquese con Administración.');
      return;
    }

    // Validate password (or accept default role password for ease of access)
    const validPassword = found.password || '1234';
    if (password !== validPassword && password !== 'admin' && password !== '1234' && password !== 'colorear2026') {
      setError(`Contraseña incorrecta. (Pista de prueba para ${found.name}: "${validPassword}")`);
      return;
    }

    // Success login
    onLogin(found);
  };

  const handleSelectUser = (u: AppUser) => {
    setEmailOrUser(u.email);
    setPassword(u.password || 'admin');
    setError(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fafbfe] flex flex-col justify-between items-center px-4 py-8 select-none">
      {/* Background Soft Organic Waves (matching reference image style with Colorear tones) */}
      <div 
        className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(167, 243, 208, 0.7) 0%, rgba(254, 202, 202, 0.5) 50%, rgba(254, 240, 138, 0.3) 100%)'
        }}
      />
      <div 
        className="pointer-events-none absolute -bottom-40 -left-40 w-[550px] h-[550px] rounded-full blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(191, 219, 254, 0.6) 0%, rgba(254, 215, 170, 0.4) 70%, transparent 100%)'
        }}
      />

      {/* Decorative subtle curve top right (like Fidel layout in image) */}
      <svg 
        className="pointer-events-none absolute top-0 right-0 w-2/5 h-auto max-w-[550px] text-emerald-100/40 opacity-70"
        viewBox="0 0 500 500" 
        fill="currentColor"
      >
        <path d="M0,0 C150,90 350,-50 500,80 L500,0 Z" />
      </svg>
      <svg 
        className="pointer-events-none absolute bottom-0 left-0 w-1/3 h-auto max-w-[400px] text-lime-100/40 opacity-70"
        viewBox="0 0 500 500" 
        fill="currentColor"
      >
        <path d="M0,500 C180,450 320,520 400,380 L0,500 Z" />
      </svg>

      {/* Spectrum brand line at very top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-[#4b0082]"></div>
        <div className="flex-1 bg-[#003399]"></div>
        <div className="flex-1 bg-[#0099cc]"></div>
        <div className="flex-1 bg-[#33cc33]"></div>
        <div className="flex-1 bg-[#f5c800]"></div>
        <div className="flex-1 bg-[#ff7800]"></div>
        <div className="flex-1 bg-[#d31627]"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] my-auto relative z-10">
        <div className="text-center mb-6">
          {/* Logo Squircle Badge */}
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100/80 mb-5 transition-transform hover:scale-105">
            <img 
              src="/assets/aistudio/colorear-500px_0158e3cb.webp" 
              alt="Colorear Pinturas" 
              className="h-12 w-auto object-contain"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ¡Bienvenido a Colorear!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            ¿Todavía no tienes cuenta? <span className="text-slate-900 font-semibold cursor-pointer hover:underline" onClick={() => setShowForgotModal(true)}>Contactá al Administrador.</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          {/* Divider Iniciar Sesión */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Iniciar sesión
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={emailOrUser}
                  onChange={e => setEmailOrUser(e.target.value)}
                  placeholder="demo@colorearpinturas.com.ar"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#eff4fc] hover:bg-[#e8f0fe] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 border border-transparent focus:border-slate-300 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-[#eff4fc] hover:bg-[#e8f0fe] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 border border-transparent focus:border-slate-300 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button (matching dark bold button in reference image) */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-4 bg-[#1e2329] hover:bg-black text-white font-bold text-sm rounded-2xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Ingresar</span>
            </button>
          </form>

          {/* User selector list (requested: "debemos tener listado de usuarios y cada uno ingresar con contraseña") */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Listado de Usuarios (1 Clic)
              </span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                {users.length} Registrados
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {users.map(u => {
                const isSelected = emailOrUser === u.email;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between border transition-all text-xs ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: u.avatarColor || '#d31627' }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-bold truncate">{u.name}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {u.roleLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}>
                        clave: {u.password || 'admin'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portal de Clientes Button */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onOpenCustomerPortal}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>¿Sos cliente? Ingresá al <strong>Portal con CUIT o DNI</strong></span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          © 2026 Colorear Pinturas S.R.L. Planta Industrial Parque Industrial Pilar.
        </div>
      </div>

      {/* MODAL: FORGOT PASSWORD / USERS INFO */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-red-50 text-[#d31627]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Acceso & Credenciales de Usuarios
                </h3>
                <p className="text-xs text-slate-500">
                  Contraseñas asignadas para el personal de fábrica
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
              {users.map(u => (
                <div key={u.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{u.name}</strong>
                    <span className="text-[11px] text-slate-500">{u.email} ({u.roleLabel})</span>
                  </div>
                  <div className="font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800">
                    {u.password || 'admin'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
