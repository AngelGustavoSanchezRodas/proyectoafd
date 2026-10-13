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
    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <table className="w-full text-sm text-left text-slate-700 dark:text-slate-200">
        <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-900">
          <tr>
            <th className="px-6 py-3 font-bold border-b-2 border-slate-300 dark:border-slate-600">Estado Actual</th>
            {dfa.symbols.map((sym) => (
              <th key={sym} className="px-6 py-3 text-center font-bold border-b-2 border-slate-300 dark:border-slate-600">
                Lee '{sym}'
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((state) => {
            const isCurrent = state === currentState;
            const isAccept = dfa.acceptStates.has(state);
            const isInitial = state === dfa.initialState;

            return (
              <tr key={state} className={`border-b dark:border-slate-700 transition-colors duration-300 ${isCurrent ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <td className="px-6 py-4 flex items-center gap-2">
                  <span className="w-6 text-center font-black text-blue-600 dark:text-blue-400">{isInitial ? '→' : ''}</span>
                  <span className={`font-mono text-base ${isCurrent ? 'font-bold text-yellow-800 dark:text-yellow-400' : ''}`}>
                    {isAccept ? `(( ${state} ))` : state}
                  </span>
                </td>
                {dfa.symbols.map((sym) => {
                  const targetState = dfa.transitions[state][sym];
                  const isActiveTransition = activeTransition?.from === state && activeTransition?.symbol === sym;
                  
                  return (
                    <td key={sym} className="px-6 py-4 text-center">
                      <div className={`inline-block px-3 py-1 rounded transition-all duration-300 ${
                        isActiveTransition ? 'bg-red-500 text-white font-bold scale-110 shadow-md' : 'bg-transparent'
                      }`}>
                        {targetState || '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}