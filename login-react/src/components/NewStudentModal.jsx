import React, { useState } from 'react';

export default function NewStudentModal({ isOpen, onClose, activeFicha, onSubmit }) {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newStudent = {
      name: studentName,
      id: studentId,
      group: activeFicha,
      status: 'Activo'
    };
    onSubmit(newStudent);
    // Reset form states
    setStudentName('');
    setStudentId('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '400px', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '20px', fontWeight: '700', fontSize: '1.25rem' }}>
          Agregar Nuevo Estudiante (Ficha {activeFicha})
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                ID / Documento
              </label>
              <input
                type="text"
                placeholder="Ej: 102543..."
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '25px' }}>
            <button type="button" onClick={onClose} className="btn-modal-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-modal-primary" style={{ backgroundColor: '#051414', color: 'white' }}>
              Guardar Aprendiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
