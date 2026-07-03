import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import QRCode from 'qrcode';
import { 
  Plus, 
  UserPlus, 
  ArrowLeft, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import NewClassModal from '../components/NewClassModal';
import NewStudentModal from '../components/NewStudentModal';
import AbsenceModal from '../components/AbsenceModal';
import NotificationModal from '../components/NotificationModal';
import CustomConfirmModal from '../components/CustomConfirmModal';

import '../style.css'; // Original styles

const API_BASE = window.location.port === '5173' ? 'http://localhost:3000' : '';

export default function Dashboard() {
  // Navigation & Filtering Tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fichaFilter, setFichaFilter] = useState('');

  // Core Data States
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [serverInfo, setServerInfo] = useState({ ip: 'localhost', port: '3000' });

  // Dismissed Alerts (localStorage sync)
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');
  });

  // Modal Control States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Selected details
  const [selectedFicha, setSelectedFicha] = useState(null); // Inside Mis Fichas
  const [classToDelete, setClassToDelete] = useState(null); // Ficha pending deletion

  // QR Code States
  const [publicUrl, setPublicUrl] = useState('');
  
  // Refs
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const qrCanvasRef = useRef(null);

  // 1. Fetch backend data
  const fetchData = async () => {
    try {
      const [classesRes, studentsRes, attendanceRes] = await Promise.all([
        fetch(`${API_BASE}/api/classes`),
        fetch(`${API_BASE}/api/students`),
        fetch(`${API_BASE}/api/attendance`),
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData);
      }
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // 2. Initial mount configurations & polling
  useEffect(() => {
    // Set body background to dashboard color
    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#1a1c1e';

    fetchData();
    
    // Fetch server IP info
    fetch(`${API_BASE}/api/info`)
      .then(r => r.json())
      .then(info => setServerInfo(info))
      .catch(err => console.error("Error fetching server info:", err));

    // Polling every 5 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => {
      clearInterval(interval);
      // Clean up body styles
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  // 3. Render Chart.js
  useEffect(() => {
    if (activeTab !== 'seguimiento' || !chartRef.current) return;

    // Filter data for chart
    let filteredStudents = students;
    let filteredAttendance = attendance;
    
    if (fichaFilter) {
      filteredStudents = students.filter(s => s.group === fichaFilter);
      filteredAttendance = attendance.filter(a => a.group === fichaFilter);
    }

    const presentCount = filteredAttendance.filter(a => a.status === 'Presente').length;
    const lateCount = filteredAttendance.filter(a => a.status === 'Tarde').length;
    // Ausentes: Total students in group - those present or late
    const absentCount = Math.max(0, filteredStudents.length - (presentCount + lateCount));

    const ctx = chartRef.current.getContext('2d');
    
    // Destroy existing chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create new chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Presentes', 'Tardes', 'Ausentes'],
        datasets: [{
          data: [presentCount, lateCount, absentCount],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12,
                weight: '500'
              }
            }
          }
        },
        cutout: '70%'
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [activeTab, students, attendance, fichaFilter]);

  // 4. Render QR Code
  useEffect(() => {
    if (activeTab !== 'toma' || !fichaFilter || !qrCanvasRef.current) return;

    const baseUrl = publicUrl.trim() 
      ? publicUrl.replace(/\/$/, '') 
      : `http://${serverInfo.ip}:${serverInfo.port}`;

    const checkInUrl = `${baseUrl}/checkin?ficha=${fichaFilter}`;

    QRCode.toCanvas(qrCanvasRef.current, checkInUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#051414',
        light: '#ffffff'
      }
    }, (err) => {
      if (err) console.error("Error generating QR code:", err);
    });
  }, [activeTab, fichaFilter, publicUrl, serverInfo]);

  // --- HANDLERS ---

  // Toggle Attendance Status (Presente -> Tarde -> Ausente -> Presente)
  const handleToggleStatus = async (doc, currentStatus) => {
    if (doc === '---') return;
    
    let newStatus = 'Presente';
    if (currentStatus === 'Presente') newStatus = 'Tarde';
    else if (currentStatus === 'Tarde') newStatus = 'Ausente';

    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });

    try {
      const response = await fetch(`${API_BASE}/api/attendance/${doc}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, time: time })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // Mark student as absent manually (from AbsenceModal)
  const handleMarkAsAbsent = async (student) => {
    try {
      const response = await fetch(`${API_BASE}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: student.name, 
          doc: student.id, 
          group: student.group, 
          status: 'Ausente' 
        })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error marking absent:", err);
    }
  };

  // Add new Ficha (Save class)
  const handleCreateClass = async (newClass) => {
    try {
      const response = await fetch(`${API_BASE}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass)
      });
      if (response.ok) {
        setIsClassModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Error creating class:", err);
    }
  };

  // Delete Ficha (Delete class)
  const handleDeleteClassConfirm = async () => {
    if (!classToDelete) return;
    try {
      const response = await fetch(`${API_BASE}/api/classes/${classToDelete.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setIsConfirmModalOpen(false);
        setClassToDelete(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  // Add new student
  const handleCreateStudent = async (newStudent) => {
    try {
      const response = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      if (response.ok) {
        setIsStudentModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Error creating student:", err);
    }
  };

  // Dismiss a specific critical alert
  const handleDismissAlert = (id) => {
    const updated = [...dismissedAlerts, id];
    setDismissedAlerts(updated);
    localStorage.setItem('dismissedAlerts', JSON.stringify(updated));
  };

  // Restore all dismissed alerts
  const handleRestoreAlerts = () => {
    setDismissedAlerts([]);
    localStorage.removeItem('dismissedAlerts');
  };

  // Dismiss all alerts in NotificationModal
  const handleDismissAllNotifications = () => {
    const newDismissed = [...dismissedAlerts, ...activeAlerts.map(a => a.id)];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
    setIsNotificationModalOpen(false);
  };

  // --- STATS CALCULATIONS ---
  
  // Filter core data by current Ficha filter
  const filteredStudents = students.filter(s => !fichaFilter || s.group === fichaFilter);
  const filteredAttendance = attendance.filter(a => !fichaFilter || a.group === fichaFilter);

  // Stats for the stat-cards
  const totalStudentsCount = filteredStudents.length;
  const presentCount = filteredAttendance.filter(a => a.status === 'Presente').length;
  const lateCount = filteredAttendance.filter(a => a.status === 'Tarde').length;
  const absentCount = filteredAttendance.filter(a => a.status === 'Ausente').length;

  // Alerts logic: count inasistencias (status = 'Ausente' in history)
  const allAlerts = students.map(s => {
    const absences = attendance.filter(a => a.doc === s.id && a.status === 'Ausente').length;
    return { ...s, absences };
  }).filter(s => s.absences > 0).sort((a, b) => b.absences - a.absences);

  const activeAlerts = allAlerts.filter(a => !dismissedAlerts.includes(a.id));

  // Missing students (never registered/present in current attendance list)
  const presentIds = attendance.map(a => a.doc);
  const missingStudents = students.filter(s => !presentIds.includes(s.id));
  const filteredMissingStudents = missingStudents.filter(s => !fichaFilter || s.group === fichaFilter);

  return (
    <div className="flex min-h-screen bg-slate-50 w-full">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="main-container flex-grow p-10 bg-slate-50 min-h-screen">
        <Header 
          notificationCount={activeAlerts.length} 
          onNotificationClick={() => setIsNotificationModalOpen(true)} 
        />

        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div id="view-dashboard" className="content-view">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Dashboard Asistencia</h1>
            
            {/* Stats grid */}
            <section className="dashboard-grid">
              <div className="stat-card total">
                <div className="stat-label">Total Aprendices</div>
                <div className="stat-value">{totalStudentsCount}</div>
              </div>
              <div className="stat-card presentes">
                <div className="stat-label">Presentes</div>
                <div className="stat-value">{presentCount}</div>
              </div>
              <div className="stat-card tardes">
                <div className="stat-label">Tardes</div>
                <div className="stat-value">{lateCount}</div>
              </div>
              <div className="stat-card ausentes">
                <div className="stat-label">Ausentes</div>
                <div className="stat-value">{absentCount}</div>
              </div>
            </section>

            <div className="content-sections mt-6">
              {/* Critical Alerts Dashboard Widget */}
              <section className="section-card" style={{ gridColumn: 'span 3' }}>
                <div className="section-title text-slate-800 font-bold border-b border-slate-100 pb-3 mb-4">
                  Alertas Críticas de Inasistencia
                </div>
                <div className="alert-list max-h-[250px] overflow-y-auto space-y-3 pr-2">
                  {activeAlerts.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Sin alertas pendientes.
                    </p>
                  ) : (
                    activeAlerts.slice(0, 5).map((a) => (
                      <div 
                        key={a.id} 
                        className={`alert-item ${a.absences >= 3 ? 'alert-danger' : 'alert-warning'}`}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} />
                          <div>
                            <strong>{a.name}</strong> (Ficha: {a.group}) - {a.absences} inasistencias
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDismissAlert(a.id)}
                          className="bg-transparent border-none text-inherit cursor-pointer hover:opacity-75"
                          title="Silenciar Alerta"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="content-sections mt-6">
              {/* Real Time Attendance Table */}
              <section className="section-card" style={{ gridColumn: 'span 3' }}>
                <div className="section-title text-slate-800 font-bold border-b border-slate-100 pb-3 mb-4">
                  Últimos Registros de Asistencia
                  <button 
                    onClick={() => setIsAbsenceModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs border border-slate-200 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition-all font-semibold"
                  >
                    <RefreshCw size={12} className="animate-spin-slow" />
                    Gestionar Faltas
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="attendance-table w-full">
                    <thead>
                      <tr>
                        <th className="w-12">#</th>
                        <th>Aprendiz</th>
                        <th>ID</th>
                        <th>Hora</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            Esperando registros...
                          </td>
                        </tr>
                      ) : (
                        attendance.slice(-10).reverse().map((a, i) => (
                          <tr key={`${a.doc}-${i}`}>
                            <td>{attendance.length - i}</td>
                            <td className="font-semibold text-slate-700">{a.name}</td>
                            <td className="text-slate-500">{a.doc}</td>
                            <td className="text-slate-500">{a.time || '--:--'}</td>
                            <td>
                              <span 
                                onClick={() => handleToggleStatus(a.doc, a.status)}
                                className={`status-badge cursor-pointer select-none status-${a.status.toLowerCase()}`}
                              >
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* --- VIEW: MIS FICHAS --- */}
        {activeTab === 'fichas' && (
          <div id="view-fichas" className="content-view">
            {!selectedFicha ? (
              <div id="fichasMain">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-extrabold text-slate-800">Mis Fichas / Grupos</h1>
                  <button 
                    onClick={() => setIsClassModalOpen(true)}
                    className="btn-primary flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    Nueva Clase
                  </button>
                </div>
                
                <div className="dashboard-grid">
                  {classes.length === 0 ? (
                    <div className="section-card col-span-3 text-center py-10 text-slate-400">
                      No hay fichas registradas. Crea una nueva para comenzar.
                    </div>
                  ) : (
                    classes.map((c) => (
                      <div 
                        key={c.id} 
                        className="section-card flex flex-col justify-between" 
                        style={{ borderLeft: `5px solid ${c.color || '#00e5e5'}` }}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-slate-800">Ficha {c.name}</h2>
                            <button 
                              onClick={() => {
                                setClassToDelete(c);
                                setIsConfirmModalOpen(true);
                              }}
                              className="text-red-500 bg-transparent border-none cursor-pointer hover:text-red-700 transition-colors"
                              title="Eliminar Ficha"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-slate-500 text-sm mb-4 font-medium">{c.description}</p>
                          <p className="text-slate-600 text-xs mb-1"><strong>Instructor:</strong> {c.instructor}</p>
                          <p className="text-slate-600 text-xs mb-1"><strong>Ambiente:</strong> {c.room}</p>
                          <p className="text-slate-600 text-xs"><strong>Horario:</strong> {c.time}</p>
                        </div>
                        <button 
                          className="btn-primary w-full mt-4" 
                          style={{ backgroundColor: c.color || '#00e5e5', color: '#051414' }}
                          onClick={() => setSelectedFicha(c.name)}
                        >
                          Abrir Ficha
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div id="fichaDetail">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedFicha(null)}
                      className="notification-btn flex items-center justify-center"
                    >
                      <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-extrabold text-slate-800">Estudiantes - Ficha {selectedFicha}</h1>
                  </div>
                  <button 
                    onClick={() => setIsStudentModalOpen(true)}
                    className="btn-primary flex items-center gap-1.5"
                  >
                    <UserPlus size={16} />
                    Agregar Estudiante
                  </button>
                </div>

                <div className="section-card">
                  <div className="overflow-x-auto">
                    <table className="attendance-table w-full">
                      <thead>
                        <tr>
                          <th>ID / Documento</th>
                          <th>Nombre Completo</th>
                          <th>Asistencia %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.filter(s => s.group === selectedFicha).length === 0 ? (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                              No hay estudiantes registrados en esta ficha.
                            </td>
                          </tr>
                        ) : (
                          students.filter(s => s.group === selectedFicha).map((s) => {
                            const studentAttendance = attendance.filter(a => a.doc === s.id);
                            const totalSessions = studentAttendance.length;
                            const presents = studentAttendance.filter(a => a.status === 'Presente').length;
                            const percent = totalSessions > 0 ? Math.round((presents / totalSessions) * 100) : 0;
                            
                            return (
                              <tr key={s.id}>
                                <td className="font-semibold text-slate-600">{s.id}</td>
                                <td className="text-slate-800 font-medium">{s.name}</td>
                                <td>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${percent}%`, 
                                          backgroundColor: percent > 80 ? '#10b981' : (percent > 50 ? '#f59e0b' : '#ef4444') 
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{percent}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: TOMA DE ASISTENCIA --- */}
        {activeTab === 'toma' && (
          <div id="view-toma-de-asistencia" className="content-view">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Toma de Asistencia Digital</h1>
            <div className="content-sections">
              {/* QR Section */}
              <section className="section-card">
                <div className="section-title text-slate-800 font-bold border-b border-slate-100 pb-3 mb-4">
                  Punto de Registro QR
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 block mb-2">Seleccionar Ficha:</label>
                  <select 
                    value={fichaFilter}
                    onChange={(e) => setFichaFilter(e.target.value)}
                    className="btn-primary w-full text-left bg-white text-slate-800 border border-slate-200 p-2.5 rounded-xl outline-none"
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="">-- Seleccionar Ficha --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.name}>{c.name} - {c.description}</option>
                    ))}
                  </select>
                </div>

                {fichaFilter ? (
                  <div className="qr-container mt-4">
                    <div className="qr-box bg-white p-4 border border-slate-200 rounded-2xl inline-block shadow-sm">
                      <canvas ref={qrCanvasRef}></canvas>
                    </div>
                    <div className="mt-4 text-left">
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        URL Pública (Opcional):
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej: http://192.168.1.50:3000"
                        value={publicUrl}
                        onChange={(e) => setPublicUrl(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 bg-slate-50"
                      />
                    </div>
                    <button 
                      onClick={() => setPublicUrl(publicUrl + '?t=' + Date.now())}
                      className="btn-primary w-full mt-4"
                    >
                      Actualizar QR
                    </button>
                    <p className="qr-info mt-3 font-semibold text-slate-500 text-xs">
                      Ficha activa: {fichaFilter}
                    </p>
                  </div>
                ) : (
                  <div id="qrPlaceholderToma" className="text-center py-10 text-slate-400">
                    <QrCode size={48} className="mx-auto mb-2 opacity-25" />
                    <p className="text-sm">Selecciona una ficha para generar el QR de asistencia</p>
                  </div>
                )}
              </section>

              {/* Table Section */}
              <section className="section-card">
                <div className="section-title text-slate-800 font-bold border-b border-slate-100 pb-3 mb-4">
                  Asistencias de la Sesión Actual
                </div>
                <div className="overflow-x-auto">
                  <table className="attendance-table w-full">
                    <thead>
                      <tr>
                        <th className="w-12">#</th>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Hora</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            No hay registros para la ficha seleccionada.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendance.map((a, i) => (
                          <tr key={`${a.doc}-${i}`}>
                            <td>{i + 1}</td>
                            <td className="font-semibold text-slate-700">{a.name}</td>
                            <td className="text-slate-500">{a.doc}</td>
                            <td className="text-slate-500">{a.time || '--:--'}</td>
                            <td>
                              <span 
                                onClick={() => handleToggleStatus(a.doc, a.status)}
                                className={`status-badge cursor-pointer select-none status-${a.status.toLowerCase()}`}
                              >
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* --- VIEW: SEGUIMIENTO --- */}
        {activeTab === 'seguimiento' && (
          <div id="view-seguimiento" className="content-view">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-extrabold text-slate-800">Seguimiento de Asistencia</h1>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500">Filtrar por Ficha:</label>
                <select 
                  value={fichaFilter}
                  onChange={(e) => setFichaFilter(e.target.value)}
                  className="btn-primary bg-white text-slate-800 border border-slate-200 p-2.5 rounded-xl outline-none font-semibold text-xs"
                >
                  <option value="">Todas las Fichas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>Ficha {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Global Summary Chart */}
            <div className="section-card max-w-[500px] mx-auto min-h-[450px] flex flex-col items-center justify-between">
              <div className="section-title text-slate-800 font-bold border-b border-slate-100 pb-3 mb-4 w-full text-center">
                {fichaFilter ? `Ficha ${fichaFilter}` : 'Resumen General'}
              </div>
              <div className="flex-grow w-full relative h-[300px]">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: ALERTAS --- */}
        {activeTab === 'alertas' && (
          <div id="view-alertas" className="content-view">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Gestión de Alertas</h1>
            <div className="section-card" id="alertDetailContainer">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <span className="text-sm text-slate-500 font-medium">
                  {activeAlerts.length} alertas activas
                </span>
                <button 
                  onClick={handleRestoreAlerts}
                  className="btn-modal-secondary text-xs px-3 py-1.5 font-bold hover:bg-slate-50"
                  style={{ flex: 'none' }}
                >
                  Restablecer Todas
                </button>
              </div>
              
              <div className="alert-list space-y-3">
                {activeAlerts.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No hay alertas activas.
                  </p>
                ) : (
                  activeAlerts.map((a) => (
                    <div 
                      key={a.id} 
                      className={`alert-item ${a.absences >= 3 ? 'alert-danger' : 'alert-warning'}`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <strong>{a.name}</strong> (Ficha: {a.group})
                          <div style={{ fontSize: '0.8rem', opacity: '0.8' }}>
                            {a.absences} inasistencias detectadas
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDismissAlert(a.id)}
                          className="notification-btn bg-slate-200/50 hover:bg-slate-200 border-none w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: REPORTES --- */}
        {activeTab === 'reportes' && (
          <div id="view-reportes" className="content-view">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Reportes y Exportación</h1>
            <div className="section-card">
              <p className="text-slate-600 mb-4">Descarga el historial completo de asistencia en formato Excel o PDF.</p>
              <div className="flex gap-4">
                <button 
                  className="btn-primary flex items-center gap-2" 
                  style={{ backgroundColor: '#10b981' }}
                  onClick={() => alert("Función Exportar Excel en construcción...")}
                >
                  <FileSpreadsheet size={18} />
                  Exportar Excel
                </button>
                <button 
                  className="btn-primary flex items-center gap-2" 
                  style={{ backgroundColor: '#ef4444' }}
                  onClick={() => alert("Función Exportar PDF en construcción...")}
                >
                  <FileText size={18} />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      <NewClassModal 
        isOpen={isClassModalOpen} 
        onClose={() => setIsClassModalOpen(false)} 
        onSubmit={handleCreateClass} 
      />

      <NewStudentModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
        activeFicha={selectedFicha} 
        onSubmit={handleCreateStudent} 
      />

      <AbsenceModal 
        isOpen={isAbsenceModalOpen} 
        onClose={() => setIsAbsenceModalOpen(false)} 
        missingStudents={filteredMissingStudents} 
        onMarkAbsent={handleMarkAsAbsent} 
      />

      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)} 
        alerts={activeAlerts} 
        onClearAll={handleDismissAllNotifications} 
      />

      <CustomConfirmModal 
        isOpen={isConfirmModalOpen} 
        onClose={() => {
          setIsConfirmModalOpen(false);
          setClassToDelete(null);
        }} 
        onConfirm={handleDeleteClassConfirm} 
        title={`¿Eliminar Ficha ${classToDelete?.name || ''}?`} 
        message="Esta acción no se puede deshacer. Todos los registros y estudiantes asociados se mantendrán en el servidor, pero la ficha será desvinculada."
      />
    </div>
  );
}
