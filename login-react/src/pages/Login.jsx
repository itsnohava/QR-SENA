import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Users, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';
import senaLogo from '../assets/sena-logo.svg';
import bgMenu from '../assets/bg-menu.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('instructor'); // 'instructor' or 'coordinador'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor ingresa tu correo institucional.');
      return;
    }
    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }
    
    // Validate sena domain
    if (!email.endsWith('@sena.edu.co') && !email.endsWith('@misena.edu.co')) {
      setError('El correo institucional debe terminar en @sena.edu.co o @misena.edu.co');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      // Store session state
      if (rememberMe) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
      } else {
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('userEmail', email);
      }
      
      // Redirect to dashboard page
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-gray-50 p-4 md:p-8 relative selection:bg-green-600 selection:text-gray-900">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-600 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row my-auto">
        
        {/* LEFT PANEL - INFORMATIVE */}
        <div 
          className="w-full lg:w-[42%] relative p-8 lg:p-12 flex flex-col justify-between items-center overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-300 min-h-[360px] lg:min-h-[660px]"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 9, 0.88) 0%, rgba(5, 10, 9, 0.95) 100%), url(${bgMenu})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Top-Left Dot Matrix */}
          <div className="absolute top-4 left-4 grid grid-cols-5 gap-1.5 opacity-20 pointer-events-none">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-emerald-600"></div>
            ))}
          </div>

          {/* Bottom-Left Dot Matrix */}
          <div className="absolute bottom-4 left-4 grid grid-cols-5 gap-1.5 opacity-20 pointer-events-none">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-emerald-600"></div>
            ))}
          </div>

          {/* Logo Area */}
          <div className="flex flex-col items-center mt-6 lg:mt-8 relative z-10">
            <div className="w-24 h-24 mb-3 flex items-center justify-center filter drop-shadow-sm">
              <img 
                src={senaLogo} 
                alt="SENA Logo" 
                className="w-full h-full object-contain brightness-110 contrast-125" 
                style={{ filter: 'invert(52%) sepia(85%) saturate(1910%) hue-rotate(85deg) brightness(101%) contrast(105%)' }}
              />
            </div>
            <span className="text-green-700 text-2xl font-bold tracking-widest uppercase">SENA</span>
          </div>

          {/* Welcome Text */}
          <div className="flex flex-col items-center text-center my-6 lg:my-auto max-w-sm relative z-10">
            <h2 className="text-gray-900 text-lg lg:text-xl font-normal leading-relaxed">
              Bienvenido al sistema de
              <span className="block text-green-700 text-2xl lg:text-3xl font-extrabold mt-1 filter drop-shadow-sm">
                Control de Asistencia
              </span>
            </h2>
            
            {/* Accent Line */}
            <div className="w-16 h-1 bg-green-600 rounded-full my-4 shadow-sm"></div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              Gestiona y controla la asistencia de aprendices de forma fácil, rápida y segura.
            </p>
          </div>

          {/* Features Badges */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-auto relative z-10">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 rounded-full border border-green-600 flex items-center justify-center mb-2 bg-gray-50 transition-all duration-300 group-hover:border-emerald-600 group-hover:shadow-sm">
                <Users className="w-5 h-5 text-green-700" />
              </div>
              <span className="text-[10px] lg:text-xs text-gray-600 font-medium leading-tight group-hover:text-gray-900 transition-colors duration-200">
                Gestión de Aprendices
              </span>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 rounded-full border border-green-600 flex items-center justify-center mb-2 bg-gray-50 transition-all duration-300 group-hover:border-emerald-600 group-hover:shadow-sm">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
              <span className="text-[10px] lg:text-xs text-gray-600 font-medium leading-tight group-hover:text-gray-900 transition-colors duration-200">
                Reportes en tiempo real
              </span>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 rounded-full border border-green-600 flex items-center justify-center mb-2 bg-gray-50 transition-all duration-300 group-hover:border-emerald-600 group-hover:shadow-sm">
                <ShieldAlert className="w-5 h-5 text-green-700" />
              </div>
              <span className="text-[10px] lg:text-xs text-gray-600 font-medium leading-tight group-hover:text-gray-900 transition-colors duration-200">
                Información segura
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - LOGIN FORM */}
        <div className="w-full lg:w-[58%] p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Iniciar <span className="text-green-700 filter drop-shadow-sm">sesión</span>
              </h1>
              <p className="text-gray-600 text-sm">
                Accede al sistema con tu cuenta institucional <span className="text-green-600 font-semibold">SENA</span>
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex py-4 items-center mb-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Selecciona tu rol
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Role: Instructor */}
              <button
                type="button"
                onClick={() => setRole('instructor')}
                className={`relative flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  role === 'instructor'
                    ? 'border-emerald-600 bg-green-600 shadow-md text-gray-900'
                    : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-green-600 hover:text-gray-900'
                }`}
              >
                {/* Active Indicator Checkmark */}
                {role === 'instructor' && (
                  <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-2.5 h-2.5 text-gray-900 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className={`p-2.5 rounded-lg mb-3 ${role === 'instructor' ? 'text-green-700 bg-green-600' : 'text-gray-600 bg-gray-200'}`}>
                  {/* Presentation board svg */}
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-9.5m0 0h-.5" />
                  </svg>
                </div>
                <span className={`text-sm font-bold block mb-1 ${role === 'instructor' ? 'text-green-700' : ''}`}>Instructor</span>
                <span className="text-[10px] leading-tight text-gray-600">Gestiona la asistencia de aprendices</span>
              </button>

              {/* Role: Coordinador */}
              <button
                type="button"
                onClick={() => setRole('coordinador')}
                className={`relative flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  role === 'coordinador'
                    ? 'border-emerald-600 bg-green-600 shadow-md text-gray-900'
                    : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-green-600 hover:text-gray-900'
                }`}
              >
                {/* Active Indicator Checkmark */}
                {role === 'coordinador' && (
                  <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-2.5 h-2.5 text-gray-900 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className={`p-2.5 rounded-lg mb-3 ${role === 'coordinador' ? 'text-green-700 bg-green-600' : 'text-orange-500 bg-orange-500/10'}`}>
                  {/* Coordinator / User with settings cog svg */}
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    <circle cx="18" cy="12" r="2" className="stroke-[2] text-orange-500 fill-none" />
                  </svg>
                </div>
                <span className={`text-sm font-bold block mb-1 ${role === 'coordinador' ? 'text-green-700' : ''}`}>Coordinador</span>
                <span className="text-[10px] leading-tight text-gray-600">Administra reportes y gestiona instructores</span>
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Institutional Email Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2 tracking-wide">
                  Correo institucional SENA
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@sena.edu.co"
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-green-600 focus:shadow-md outline-none text-sm transition-all placeholder:text-gray-600"
                  />
                </div>
                <span className="block text-[10px] text-green-700 mt-1.5 pl-0.5">
                  Usa tu correo institucional @sena.edu.co o @misena.edu.co
                </span>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2 tracking-wide">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-11 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-green-600 focus:shadow-md outline-none text-sm transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer group text-gray-600 hover:text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 bg-gray-50 group-hover:border-green-600'
                  }`}>
                    {rememberMe && (
                      <svg className="w-3 h-3 text-gray-900 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span>Recordar sesión</span>
                </label>
                
                <a href="#forgot" className="text-green-700 hover:text-green-700 font-medium hover:underline transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-md transition-all duration-300 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed group text-sm cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 mb-2 flex flex-col items-center gap-1.5 text-center relative z-10">
        <div className="flex items-center justify-center text-gray-600 select-none mb-0.5">
          <svg className="w-4 h-4 text-green-600 filter drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          Derechos reservados sena
        </span>
      </footer>
    </div>
  );
}
