import React from 'react';
import { AlertTriangle, UserX } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, alerts, onClearAll }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '450px', padding: '30px' }}>
        <div className="modal-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444', marginBottom: '20px' }}>
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ marginBottom: '15px', fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>
          Notificaciones de Asistencia
        </h2>
        
        <div 
          id="notificationList" 
          style={{ 
            marginBottom: '25px', 
            maxHeight: '250px', 
            overflowY: 'auto', 
            textAlign: 'left' 
          }}
        >
          {alerts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No hay notificaciones pendientes.
            </p>
          ) : (
            alerts.map((a) => (
              <div 
                key={a.id} 
                className="notification-item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  padding: '15px', 
                  backgroundColor: '#fffaf0', 
                  borderLeft: '5px solid #f59e0b', 
                  borderRadius: '12px', 
                  marginBottom: '12px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
                }}
              >
                <div style={{ color: '#92400e' }}>
                  <UserX size={20} />
                </div>
                <div style={{ fontSize: '0.95rem', color: '#92400e', fontWeight: '500' }}>
                  {a.name.toLowerCase()} - Ausente (Ficha {a.group})
                </div>
              </div>
            ))
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={onClose} className="btn-modal-secondary" style={{ padding: '12px' }}>
            Cancelar
          </button>
          <button 
            onClick={onClearAll} 
            disabled={alerts.length === 0}
            className="btn-modal-primary" 
            style={{ 
              backgroundColor: '#ef4444', 
              padding: '12px', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              opacity: alerts.length === 0 ? 0.5 : 1
            }}
          >
            Silenciar Todas
          </button>
        </div>
      </div>
    </div>
  );
}
