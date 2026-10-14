"use client";

/**
 * Avisos rápidos (toasts) no canto inferior da tela.
 * Eles confirmam ações do operador ou explicam por que
 * uma ação não foi permitida.
 */

import { useCallCenter } from "@/context/CallCenterContext";

const TONES = {
  success: "toast--success",
  warning: "toast--warning",
  danger: "toast--danger",
  neutral: "toast--neutral",
};

export default function Toast() {
  const { toasts, dismissToast } = useCallCenter();

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
      aria-label="Avisos do sistema"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${TONES[toast.tone] || TONES.neutral}`}>
          <p className="toast__message">{toast.message}</p>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
