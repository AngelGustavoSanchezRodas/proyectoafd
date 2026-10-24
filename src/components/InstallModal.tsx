// src/components/InstallModal.tsx
"use client";

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerInstall: () => void;
  hasPrompt: boolean;
  isStandalone: boolean;
}

export default function InstallModal({
  isOpen,
  onClose,
  onTriggerInstall,
  hasPrompt,
  isStandalone
}: InstallModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        id="modal-install"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-install-dialog"
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold" aria-hidden="true">
            <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <h3 id="title-install-dialog" className="text-base font-bold text-slate-900 dark:text-white">
              Instalación como Aplicación de Escritorio
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instala el Simulador AFD directamente en Windows sin necesidad de navegadores externos.
            </p>
          </div>
        </div>

        {isStandalone ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 mb-4 text-[12px]">
            <p className="font-semibold mb-1">Aplicación Instalada</p>
            <p>Ya te encuentras ejecutando la versión de escritorio nativa e independiente en Windows.</p>
          </div>
        ) : (
          <div className="space-y-3 leading-relaxed text-[12px]">
            <p>
              El proyecto está configurado con soporte nativo PWA para funcionar como una aplicación de escritorio con icono en el Escritorio y en el Menú Inicio de Windows.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white">Instrucciones de Instalación en Windows:</p>
              <ul className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                <li>
                  <strong>Desde Microsoft Edge:</strong> Haz clic en el menú <code>...</code> &gt; <em>Aplicaciones</em> &gt; <em>Instalar este sitio como una aplicación</em> (o en el icono de instalación en la barra de direcciones).
                </li>
                <li>
                  <strong>Desde Google Chrome:</strong> Haz clic en el icono de instalación situado en el lado derecho de la barra de direcciones o en <em>Menú &gt; Guardar y compartir &gt; Instalar página como aplicación</em>.
                </li>
                <li>
                  Al confirmar, Windows creará automáticamente el acceso directo en el <strong>Escritorio</strong> y en el <strong>Menú Inicio</strong>, abriendo la aplicación en una ventana independiente sin barras de navegador.
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end space-x-2.5">
          <button 
            id="btn-close-install-dialog"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
          {hasPrompt && !isStandalone && (
            <button 
              id="btn-trigger-pwa-install"
              onClick={() => {
                onTriggerInstall();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs focus:ring-2 focus:ring-blue-400 transition-all flex items-center space-x-1.5"
            >
              <span>Instalar en Windows</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
