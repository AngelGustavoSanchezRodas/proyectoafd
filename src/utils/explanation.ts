import { DFA, SimulationState } from '../types/dfa';

export function getStepExplanation(simulation: SimulationState | null, dfa: DFA | null): string {
  if (!simulation || !dfa) return "Esperando inicialización del modelo.";
  const step = simulation.history[simulation.currentStepIndex];
  
  if (simulation.status === 'idle') {
    return `Sistema inicializado. El cabezal se encuentra posicionado en el inicio de la cinta. El estado actual es el nodo inicial [${dfa.initialState}].`;
  }
  
  if (simulation.status === 'error') {
    return `Error: ${simulation.errorMessage}`;
  }

  if (simulation.status === 'rejected' && simulation.errorMessage) {
    return `${simulation.errorMessage} Cadena RECHAZADA.`;
  }
  
  if (step?.transitionUsed) {
    const trans = step.transitionUsed;
    const exp = `Transición δ(${trans.from}, '${trans.symbol}') → ${trans.to}. Estando en [${trans.from}] y consumiendo el símbolo '${trans.symbol}', el autómata transita a [${trans.to}].`;
    if (simulation.status === 'accepted') {
      return `${exp} Fin de la cadena alcanzado. El estado [${trans.to}] pertenece al conjunto de aceptación F. Cadena ACEPTADA.`;
    }
    if (simulation.status === 'rejected') {
      return `${exp} Fin de la cadena alcanzado. El estado [${trans.to}] NO pertenece al conjunto de aceptación F. Cadena RECHAZADA.`;
    }
    return exp;
  }
  
  if (simulation.currentString.length === 0) {
    return `Evaluación de cadena vacía (ε). El estado inicial [${dfa.initialState}] ${dfa.acceptStates.has(dfa.initialState) ? 'pertenece' : 'no pertenece'} a los estados de aceptación.`;
  }
  
  return "Evaluando función de transición...";
}
