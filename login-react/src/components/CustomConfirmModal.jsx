import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function CustomConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
          <AlertTriangle size={32} />
        </div>
        <h3 id="modalTitle" style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '8px' }}>
          {title || '¿Estás seguro?'}
        </h3>
        <p id="modalMessage" style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
          {message || 'Esta acción no se puede deshacer.'}
        </p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-modal-secondary">
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="btn-modal-primary" 
            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
