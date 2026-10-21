// src/components/TransitionTable.tsx
import { DFA, SimulationState } from '../types/dfa';

interface TransitionTableProps {
  dfa: DFA;
  simulation: SimulationState | null;
}

export default function TransitionTable({ dfa, simulation }: TransitionTableProps) {
  const currentStep = simulation?.history[simulation.currentStepIndex];
  const currentState = currentStep?.currentState;
  const activeTransition = currentStep?.transitionUsed;

  return (
    <div 
      id="container-transition-table"
      className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 mac-panel-vibrancy shadow-sm transition-colors duration-200"
    >
      <div className="overflow-x-auto max-h-[300px]">
        <table 
          id="table-transitions-matrix"
          aria-label="Matriz de transiciones delta"
          className="w-full text-xs text-left text-slate-700 dark:text-slate-300"
        >
          <caption className="sr-only">
            Matriz de transiciones formales delta para cada estado del autómata finito determinista
          </caption>
          <thead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 border-b border-black/5 dark:border-white/10 sticky top-0 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">Estado (Q)</th>
              {dfa.symbols.map((sym) => (
                <th key={sym} scope="col" className="px-4 py-2.5 text-center font-mono font-semibold">
                  Lee &lsquo;{sym}&rsquo;
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
            {dfa.states.map((state) => {
              const isCurrent = state === currentState;
              const isAccept = dfa.acceptStates.has(state);
              const isInitial = state === dfa.initialState;

              return (
                <tr
                  key={state}
                  className={`transition-colors duration-150 ${
                    isCurrent
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 font-semibold text-amber-900 dark:text-amber-200'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <th scope="row" className="px-4 py-2.5 flex items-center space-x-2 font-normal text-left">
                    <span className="w-4 text-center font-bold text-blue-600 dark:text-blue-400 text-xs" aria-hidden="true">
                      {isInitial ? '→' : ''}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      isCurrent
                        ? 'bg-amber-400/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-400/30'
                        : ''
                    }`}>
                      {state}
                    </span>
                    {isAccept && (
                      <span className="text-[10px] uppercase tracking-tight px-1.5 py-0.2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded font-sans border border-emerald-500/30 font-medium">
                        Aceptación
                      </span>
                    )}
                  </th>
                  {dfa.symbols.map((sym) => {
                    const dest = dfa.transitions[state]?.[sym] || '—';
                    const isActive = activeTransition?.from === state && activeTransition?.symbol === sym;

                    return (
                      <td
                        key={sym}
                        aria-label={`Transición desde ${state} con símbolo '${sym}' hacia ${dest}`}
                        className={`px-4 py-2.5 text-center transition-all ${
                          isActive
                            ? 'bg-amber-400 text-amber-950 font-bold shadow-xs scale-105 rounded-sm'
                            : ''
                        }`}
                      >
                        {dest}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}