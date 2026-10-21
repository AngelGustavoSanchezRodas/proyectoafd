// src/components/HelpModal.tsx
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        id="modal-help"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-help-dialog"
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="title-help-dialog" className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          Manual de Instrucciones del Simulador
        </h3>
        <div className="space-y-3 leading-relaxed text-[12px]">
          <p><strong>1. Cargar o Diseñar un Autómata:</strong> Utiliza el menú <em>Archivo &gt; Abrir</em> o arrastra un archivo .txt al panel inicial. También puedes hacer clic en <em>Nuevo</em> para escribir el autómata directamente en el editor.</p>
          <p><strong>2. Formato Estricto:</strong> El archivo debe contener en líneas separadas las etiquetas: <code>Simbolos:</code>, <code>Estados:</code>, <code>Estado inicial:</code>, <code>Estados de aceptación:</code>, <code>Transiciones:</code> y <code>Cadenas a analizar:</code>.</p>
          <p><strong>3. Navegación en el Tiempo (Time-Travel):</strong> Puedes avanzar o retroceder paso a paso a través de la cinta para inspeccionar cada transición y estado sin perder el historial.</p>
          <p><strong>4. Exportación:</strong> Cualquier modificación en la pestaña <em>Editor</em> puede guardarse en tu disco con <em>Archivo &gt; Guardar</em>.</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            id="btn-close-help-dialog"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs focus:ring-2 focus:ring-blue-400"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
