import React, { useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
export default function ErrorDialog({ message, focusTarget, onDismiss }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      const target = focusTarget?.isConnected ? focusTarget : previous;
      if (target?.isConnected) target.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="validation-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="validation-title"
      aria-describedby="validation-message"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <header>
        <span className="validation-icon">
          <AlertCircle size={25} />
        </span>
        <h2 id="validation-title">Periksa kembali isian Anda</h2>
        <button
          type="button"
          className="validation-close"
          aria-label="Tutup pesan kesalahan"
          onClick={onDismiss}
        >
          <X size={21} />
        </button>
      </header>
      <p id="validation-message">{message}</p>
      <footer>
        <button type="button" className="primary" autoFocus onClick={onDismiss}>
          Mengerti
        </button>
      </footer>
    </dialog>
  );
}
