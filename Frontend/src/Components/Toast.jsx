// src/Components/Toast.jsx
import React, { createContext, useContext, useMemo, useState } from 'react';
import '../styles/toast.css';

const ToastContext = createContext(null);

/**
 * Provider de notifications (popup).
 * Usage:
 *   const toast = useToast();
 *   toast.success("OK");
 *   toast.error("Erreur");
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function push(type, text) {
    const id = Date.now() + Math.random();
    const toast = { id, type, text };
    setToasts((prev) => [toast, ...prev]);

    // auto-close
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function remove(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const api = useMemo(() => {
    return {
      success: (text) => push('success', text),
      error: (text) => push('error', text),
      info: (text) => push('info', text),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* zone d’affichage */}
      <div className="toastWrap">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === 'error' ? 'toastError' : t.type === 'success' ? 'toastSuccess' : 'toastInfo'}`}
            onClick={() => remove(t.id)}
            role="button"
            tabIndex={0}
          >
            <div className="toastTitle">
              {t.type === 'error' ? 'Erreur' : t.type === 'success' ? 'Succès' : 'Info'}
            </div>
            <div className="toastText">{t.text}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() doit être utilisé dans <ToastProvider>');
  return ctx;
}