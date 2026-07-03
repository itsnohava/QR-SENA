import React from 'react';
import { Bell } from 'lucide-react';

export default function Header({ notificationCount, onNotificationClick }) {
  // Extract user name dynamically from localStorage/sessionStorage
  const userEmail = 
    localStorage.getItem('userEmail') || 
    sessionStorage.getItem('userEmail') || 
    'tecrar@sena.edu.co';
  
  const userRole = 
    localStorage.getItem('userRole') || 
    sessionStorage.getItem('userRole') || 
    'Instructor';

  // Capitalize name part of email
  const namePart = userEmail.split('@')[0];
  const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <header className="flex justify-between items-center mb-10 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="user-profile flex items-center gap-3">
        <img 
          src={`https://i.pravatar.cc/150?u=${namePart}`} 
          alt={displayName} 
          className="avatar w-10 h-10 rounded-full object-cover border-2 border-emerald-500" 
        />
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 leading-tight">{displayName}</span>
          <span className="text-xs text-slate-400 font-medium">{displayRole}</span>
        </div>
      </div>
      <div className="header-actions flex items-center gap-4">
        <button 
          onClick={onNotificationClick}
          className="notification-btn relative w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-slate-100 hover:border-slate-300"
          title="Ver Notificaciones"
        >
          <Bell size={20} className="text-slate-600" />
          {notificationCount > 0 && (
            <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
