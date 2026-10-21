// src/components/TapeViewer.tsx
import { SimulationState } from '../types/dfa';

interface TapeViewerProps {
  simulation: SimulationState | null;
}

export default function TapeViewer({ simulation }: TapeViewerProps) {
  const currentStep = simulation?.history[simulation.currentStepIndex];
  const activeCharIndex = currentStep?.stringIndex ?? -1;
  const totalSteps = simulation?.history.length ? simulation.history.length - 1 : 0;
  const currentStepNum = simulation?.currentStepIndex ?? 0;

  return (
    <section 
      id="section-tape-viewer"
      aria-label="Cinta de procesamiento y cabezal de lectura"
      className="flex flex-col space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
          Cinta de Entrada (Cabezal de Lectura)
        </h2>
        <span 
          aria-live="polite"
          className="text-[11px] font-mono text-slate-500 dark:text-slate-400"
        >
          Paso {currentStepNum} de {totalSteps}
        </span>
      </div>

      <div 
        id="tape-track-container"
        className="bg-slate-100/70 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center overflow-x-auto"
      >
        <div 
          role="list"
          aria-label="Celdas de la cinta de símbolos"
          className="flex items-center space-x-2.5 py-1"
        >
          {/* Indicador de inicio de cinta */}
          <div 
            aria-hidden="true" 
            className="h-10 w-7 rounded-l-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs select-none"
          >
            &lang;
          </div>

          {simulation?.currentString.length === 0 ? (
            <div 
              role="status"
              aria-label="Cadena vacía épsilon"
              className="px-5 py-2 font-mono text-xs italic text-slate-400"
            >
              &epsilon; (Cadena vacía)
            </div>
          ) : (
            simulation?.currentString.map((sym, idx) => {
              const isCurrent = idx === activeCharIndex;
              const isPast = idx < activeCharIndex;

              return (
                <div
                  key={idx}
                  id={`tape-cell-${idx}`}
                  role="listitem"
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={
                    isCurrent 
                      ? `Símbolo '${sym}', cabezal posicionado aquí, posición ${idx + 1}` 
                      : `Símbolo '${sym}', posición ${idx + 1}`
                  }
                  className={`h-12 min-w-[3rem] px-2.5 rounded-xl flex items-center justify-center font-mono text-base transition-all duration-200 border select-none ${
                    isCurrent
                      ? 'bg-amber-400 border-amber-300 text-amber-950 font-bold scale-110 shadow-md ring-4 ring-amber-400/25 z-10'
                      : isPast
                      ? 'bg-slate-200/60 dark:bg-slate-800/50 border-slate-300/80 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs'
                  }`}
                >
                  {sym}
                </div>
              );
            })
          )}

          {/* Indicador de fin de cinta */}
          <div 
            aria-hidden="true" 
            className="h-10 w-7 rounded-r-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs select-none"
          >
            &rang;
          </div>
        </div>
      </div>
    </section>
  );
}
