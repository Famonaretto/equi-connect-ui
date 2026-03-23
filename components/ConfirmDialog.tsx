import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '400px',
        width: '90%',
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>{title}</h3>
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '0.3rem',
              cursor: 'pointer',
            }}
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#c00',
              color: 'white',
              border: 'none',
              borderRadius: '0.3rem',
              cursor: 'pointer',
            }}
          >
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
}