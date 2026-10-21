// src/components/GuideModal.tsx
interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        id="modal-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-guide-dialog"
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="title-guide-dialog" className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          Guía Teórica: Autómatas Finitos Deterministas
        </h3>
        <div className="space-y-3 leading-relaxed text-[12px]">
          <p>Un <strong>Autómata Finito Determinista (AFD)</strong> es un modelo formal de cómputo definido como una quíntupla matemática:</p>
          <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-center font-mono font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            M = (Q, &Sigma;, &delta;, q0, F)
          </div>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Q (Conjunto de estados):</strong> Colección finita de estados posibles en la máquina.</li>
            <li><strong>&Sigma; (Alfabeto):</strong> Conjunto finito no vacío de símbolos de entrada.</li>
            <li><strong>q0 (Estado inicial):</strong> Elemento único de Q donde inicia el procesamiento.</li>
            <li><strong>F (Conjunto de aceptación):</strong> Subconjunto de Q que valida la aceptación de la cadena al agotarse la cinta.</li>
            <li><strong>&delta; (Función de transición):</strong> Mapeo determinista &delta;: Q &times; &Sigma; &rarr; Q que determina un único estado siguiente.</li>
          </ul>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            id="btn-close-guide-dialog"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs focus:ring-2 focus:ring-blue-400"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
}
