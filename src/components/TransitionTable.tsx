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
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th className="px-6 py-3 font-bold">Estado</th>
            {dfa.symbols.map((sym) => (
              <th key={sym} className="px-6 py-3 text-center font-bold">
                Leé '{sym}'
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
              <tr 
                key={state} 
                className={`border-b ${isCurrent ? 'bg-yellow-100 font-bold transition-colors' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-4 flex items-center gap-2">
                  {isInitial && <span className="text-blue-600 font-black" title="Estado Inicial">→</span>}
                  <span className={isAccept ? 'underline decoration-double decoration-green-500' : ''}>
                    {state}
                  </span>
                  {isAccept && <span className="text-xs text-green-600 font-semibold">(Aceptación)</span>}
                </td>
                
                {dfa.symbols.map((sym) => {
                  const targetState = dfa.transitions[state][sym];
                  const isActiveTransition = activeTransition?.from === state && activeTransition?.symbol === sym;
                  
                  return (
                    <td 
                      key={sym} 
                      className={`px-6 py-4 text-center ${isActiveTransition ? 'bg-red-500 text-white font-bold rounded-md' : ''}`}
                    >
                      {targetState || '-'}
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