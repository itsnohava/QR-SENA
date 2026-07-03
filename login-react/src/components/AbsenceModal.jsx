import React from 'react';
import { UserX } from 'lucide-react';

export default function AbsenceModal({ isOpen, onClose, missingStudents, onMarkAbsent }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '500px' }}>
        <div className="modal-icon" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
          <UserX size={32} />
        </div>
        <h3 style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '8px' }}>
          Gestionar Faltas
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Selecciona los estudiantes que no asistieron a la sesión.
        </p>
        
        <div 
          id="absenceListContainer" 
          style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            margin: '20px 0', 
            textAlign: 'left', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '10px' 
          }}
        >
          {missingStudents.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Todo al día.
            </p>
          ) : (
            missingStudents.map((s) => (
              <div 
                key={s.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px', 
                  borderBottom: '1px solid #f1f5f9' 
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Doc: {s.id} | Ficha: {s.group}
                  </div>
                </div>
                <button 
                  onClick={() => onMarkAbsent(s)} 
                  className="btn-primary" 
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Falta
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn-modal-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
