// src/components/AboutModal.tsx
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        id="modal-about"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-about-dialog"
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-sm flex items-center justify-center text-white text-base font-bold font-mono">
            AFD
          </div>
          <h3 id="title-about-dialog" className="text-base font-bold text-slate-900 dark:text-white">
            Simulador de AFD
          </h3>
          <p className="text-[11px] opacity-70">Versión 1.0</p>
        </div>

        <div className="space-y-1.5 py-3 border-y border-slate-200 dark:border-slate-700 text-[11px]">
          <p><strong className="text-slate-900 dark:text-white">Institución:</strong> Universidad Mariano Gálvez</p>
          <p><strong className="text-slate-900 dark:text-white">Materia:</strong> Autómatas y Lenguajes Formales</p>
          <p><strong className="text-slate-900 dark:text-white">Fecha:</strong> Octubre 2026</p>
          
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Integrantes del Equipo:</p>
            <ul className="list-disc pl-4 space-y-0.5 opacity-90">
              <li>Angel Gustavo Sánchez Rodas — 1890-24-13449</li>
              <li>Edith Aldana Gonzales — 1890-24-5214</li>
              <li>Javier Alejandro Cruz Salvador — 1890-24-14622</li>
              <li>Adelyn Alessandra Orellana Quiroz — 1890-24-6857</li>
              <li>Joseph Raul Sánchez Portillo — 1890-24-20912</li>
              <li>Brandon Gustavo Casasola Orellana — 1890-24-3551</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button 
            id="btn-close-about-dialog"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs focus:ring-2 focus:ring-blue-400"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
