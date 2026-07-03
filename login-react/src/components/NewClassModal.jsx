import React, { useState } from 'react';

export default function NewClassModal({ isOpen, onClose, onSubmit }) {
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classInstructor, setClassInstructor] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [classTime, setClassTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newClass = {
      name: className,
      description: classDesc,
      instructor: classInstructor,
      room: classRoom,
      time: classTime,
      color: '#00e5e5' // Default teal color matching style.css
    };
    onSubmit(newClass);
    // Reset form states
    setClassName('');
    setClassDesc('');
    setClassInstructor('');
    setClassRoom('');
    setClassTime('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '500px', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '20px', fontWeight: '700', fontSize: '1.25rem' }}>
          Crear Nueva Ficha / Clase
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                Número de Ficha
              </label>
              <input
                type="text"
                placeholder="Ej: 2813238"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                Programa / Descripción
              </label>
              <input
                type="text"
                placeholder="Ej: ADSO"
                value={classDesc}
                onChange={(e) => setClassDesc(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                  Instructor
                </label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={classInstructor}
                  onChange={(e) => setClassInstructor(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                  Ambiente
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lab 101"
                  value={classRoom}
                  onChange={(e) => setClassRoom(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                Horario
              </label>
              <input
                type="text"
                placeholder="Ej: 08:00 - 12:00"
                value={classTime}
                onChange={(e) => setClassTime(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '25px' }}>
            <button type="button" onClick={onClose} className="btn-modal-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-modal-primary" style={{ backgroundColor: 'var(--primary)', color: '#051414' }}>
              Guardar Ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
