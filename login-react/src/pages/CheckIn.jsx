import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = window.location.port === '5173' ? 'http://localhost:3000' : '';

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const fichaId = searchParams.get('ficha');

  // Core Data States
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // UI Control States
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch and filter students belonging to this ficha
  useEffect(() => {
    // Set body background specifically for CheckIn
    document.body.style.backgroundColor = '#051414';
    document.body.style.color = '#ffffff';

    if (!fichaId) {
      setErrorMsg('Error: No se ha detectado ninguna ficha en el enlace QR.');
      setIsLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/students`);
        if (!res.ok) throw new Error('No se pudo establecer conexión con el servidor.');
        
        const data = await res.json();
        // Filter students belonging to the scanned Ficha
        const fichaStudents = data.filter(s => s.group === fichaId);
        
        setAllStudents(fichaStudents);
        setFilteredStudents(fichaStudents);
      } catch (err) {
        setErrorMsg('Error al cargar la lista de estudiantes. Por favor, intente de nuevo.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();

    return () => {
      // Clean up body styles
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [fichaId]);

  // 2. Filter students list in real time
  useEffect(() => {
    const val = searchTerm.toLowerCase().trim();
    if (!val) {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter(s => 
        s.name.toLowerCase().includes(val) || 
        s.id.includes(val)
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, allStudents]);

  // 3. Mark attendance
  const handleSubmit = async () => {
    if (!selectedStudent || !fichaId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedStudent.name,
          doc: selectedStudent.id,
          group: fichaId,
          status: 'Presente'
        })
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        throw new Error('Error al registrar la asistencia.');
      }
    } catch (err) {
      alert('Error: No se pudo registrar. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset check-in state to allow another register
  const handleReset = () => {
    setSelectedStudent(null);
    setSearchTerm('');
    setIsSuccess(false);
  };

  // UI: Loading View
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
        <h2 className="text-[#00e5e5] text-3xl font-extrabold tracking-widest animate-pulse mb-2">AsistQR</h2>
        <p className="text-slate-400 text-sm">Cargando formulario de asistencia...</p>
      </div>
    );
  }

  // UI: Error View
  if (errorMsg) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 text-center">
        <AlertCircle className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
        <h2 className="text-gray-900 text-xl font-bold mb-2">Acceso Inválido</h2>
        <p className="text-slate-400 text-sm max-w-sm mb-6">{errorMsg}</p>
        {fichaId && (
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2.5 bg-slate-800 text-gray-900 font-semibold rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 selection:bg-[#00e5e5] selection:text-[#051414]">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#00e5e5]/5 blur-[80px] rounded-full pointer-events-none"></div>

      {/* Main Card */}
      <div className="w-full max-w-[450px] bg-white rounded-2xl p-6 shadow-sm border border-slate-100 z-10">
        
        {/* VIEW: SUCCESS SCREEN */}
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle size={36} />
            </div>
            <h2 className="text-slate-800 text-2xl font-black mb-2">¡Listo!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 px-4">
              <strong>{selectedStudent?.name}</strong>, tu asistencia ha sido guardada con éxito.
            </p>
            <button 
              onClick={handleReset} 
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Nuevo Registro
            </button>
          </div>
        ) : (
          
          /* VIEW: FORM SCREEN */
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-[#051414] font-black text-xl flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="text-emerald-500 w-6 h-6" />
                <span>AsistQR Control</span>
              </div>
              <span className="inline-block bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide border border-emerald-100">
                Ficha: {fichaId}
              </span>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Busca tu nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#00e5e5] focus:ring-1 focus:ring-[#00e5e5] outline-none text-sm font-medium transition-all"
              />
            </div>

            {/* Student List Container */}
            <div className="border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto mb-6 bg-slate-50/50">
              {filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium px-4">
                  {allStudents.length === 0 
                    ? 'No hay aprendices registrados en esta ficha.' 
                    : 'No se encontraron aprendices con ese criterio.'}
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.id === s.id;
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedStudent(s)}
                      className={`p-4 border-b border-slate-100 cursor-pointer text-left transition-all ${
                        isSelected 
                          ? 'bg-cyan-50/75 border-l-4 border-[#00e5e5] pl-3' 
                          : 'hover:bg-slate-100/50 bg-white'
                      }`}
                    >
                      <span className={`font-bold text-sm block ${isSelected ? 'text-[#051414]' : 'text-slate-700'}`}>
                        {s.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        Doc: {s.id}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Submit Button */}
            {selectedStudent && (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-[#051414] text-gray-900 font-bold rounded-xl cursor-pointer hover:bg-[#00e5e5] hover:text-[#051414] hover:shadow-sm transition-all text-sm flex items-center justify-center gap-2 border-none"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Registrar a {selectedStudent.name.split(' ')[0]}</span>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
