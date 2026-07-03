import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  LayoutDashboard, 
  Folder, 
  ClipboardCheck, 
  TrendingUp, 
  Bell, 
  PieChart, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userEmail');
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fichas', label: 'Mis Fichas', icon: Folder },
    { id: 'toma', label: 'Toma de Asistencia', icon: ClipboardCheck },
    { id: 'seguimiento', label: 'Seguimiento', icon: TrendingUp },
    { id: 'alertas', label: 'Alertas', icon: Bell },
    { id: 'reportes', label: 'Reportes', icon: PieChart },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <QrCode style={{ color: '#00e5e5', width: '28px', height: '28px' }} />
        <span>AsistQRControl</span>
      </div>
      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id} className="nav-item">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`nav-link w-full text-left bg-transparent border-none flex items-center ${
                  activeTab === item.id ? 'active' : ''
                }`}
                style={{ font: 'inherit', color: 'inherit' }}
              >
                <Icon size={18} className="mr-3" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left bg-transparent border-none flex items-center text-red-400 hover:text-red-300"
          style={{ font: 'inherit', color: '#ef4444' }}
        >
          <LogOut size={18} className="mr-3" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
