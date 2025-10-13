'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Action = { label: string; value: string };

type DialogContextType = {
  showDialog: (message: string) => void;
  showDialogWithActions: (
    message: string,
    actions: Action[],
    onSelect: (value: string) => void
  ) => void;
  showDatePicker: (message: string, onConfirm: (date: string) => void) => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [actions, setActions] = useState<Action[] | null>(null);
  const [onSelect, setOnSelect] = useState<((value: string) => void) | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [onConfirmDate, setOnConfirmDate] = useState<((date: string) => void) | null>(null);

  // 🔹 Prosty dialog z komunikatem i przyciskiem OK
  const showDialog = (msg: string) => {
    setMessage(msg);
    setActions(null);
    setOnSelect(null);
    setShowDate(false);
    setOnConfirmDate(null);
    setIsOpen(true);
  };

  // 🔹 Dialog z przyciskami akcji
  const showDialogWithActions = (
    msg: string,
    act: Action[],
    onSelectCallback: (value: string) => void
  ) => {
    setMessage(msg);
    setActions(act);
    setOnSelect(() => onSelectCallback);
    setShowDate(false);
    setOnConfirmDate(null);
    setIsOpen(true);
  };

  // 🔹 Dialog z DatePickerem
  const showDatePicker = (msg: string, onConfirm: (date: string) => void) => {
    setMessage(msg);
    setActions(null);
    setOnSelect(null);
    setShowDate(true);
    setOnConfirmDate(() => onConfirm);
    setIsOpen(true);
  };

  return (
    <DialogContext.Provider value={{ showDialog, showDialogWithActions, showDatePicker }}>
      {isOpen && (
        <dialog
          open
          style={{
            position: 'fixed',
            top: '20vh',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '2rem',
            border: 'none',
            borderRadius: '1rem',
            maxWidth: '400px',
            width: '90%',
            margin: '0 auto',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            textAlign: 'center',
            background: 'white',
          }}
        >
          <p
  style={{
    marginBottom: '2rem',
    fontSize: '1rem',
    whiteSpace: 'pre-line', // 🔹 dzięki temu \n zamieni się na <br/>
  }}
>
  {message}
</p>


          {/* 🔹 Przyciski akcji */}
          {actions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {actions.map((a) => (
                <button
                  key={a.value}
                  onClick={() => {
                    setIsOpen(false);
                    if (onSelect) onSelect(a.value);
                  }}
                  style={{
                    background: '#0D1F40',
                    color: 'white',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* 🔹 Date Picker */}
          {showDate && (
            <div>
              <input type="datetime-local" id="dateInput" style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    const input = document.getElementById('dateInput') as HTMLInputElement;
                    if (input?.value && onConfirmDate) {
                      onConfirmDate(input.value);
                    }
                    setIsOpen(false);
                  }}
                  style={{
                    background: '#0D1F40',
                    color: 'white',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Potwierdź
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: '#888',
                    color: 'white',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {/* 🔹 Tylko OK */}
          {!actions && !showDate && (
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: '#0D1F40',
                color: 'white',
                padding: '0.7rem 1.2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          )}
        </dialog>
      )}
      {children}
    </DialogContext.Provider>
  );
}

// ✅ Hook do użycia w innych komponentach
export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
