import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ModalProps {
  title: string;
  message: string;
  onClose: () => void;
  autoCloseDelay?: number; // opcional en ms, por defecto 0 (no se cierra solo)
  redirectTo?: string; // opcional, por defecto se queda donde esta
}

export function Modal({ title, message, onClose, autoCloseDelay = 0, redirectTo = "" }: ModalProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(handleClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  return (
    <div className="modalbg">
      <div className="modal">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-center">
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
          <p className="mb-6">{message}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

