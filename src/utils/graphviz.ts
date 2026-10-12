// src/utils/graphviz.ts
import { DFA, SimulationState } from '../types/dfa';

/**
 * Genera el código en lenguaje DOT para renderizar el grafo con Graphviz.
 */
export function generateDotCode(simulation: SimulationState | null, baseDfa: DFA | null): string {
  const dfa = simulation?.dfa || baseDfa;
  if (!dfa) return '';

  const currentStep = simulation?.history[simulation.currentStepIndex];
  const currentState = currentStep?.currentState;
  const activeTransition = currentStep?.transitionUsed;

  let dot = 'digraph DFA {\n';
  dot += '  rankdir=LR;\n'; // Orientación de izquierda a derecha
  dot += '  node [fontname="Arial", fontsize=12];\n';
  dot += '  edge [fontname="Arial", fontsize=10];\n\n';

  // Nodo invisible para la flecha de inicio
  dot += '  __start [shape=none, label="", width=0, height=0];\n';

  // Definición de estados
  for (const state of dfa.states) {
    const isAccept = dfa.acceptStates.has(state);
    const isCurrent = state === currentState;

    const shape = isAccept ? 'doublecircle' : 'circle';
    const style = isCurrent ? 'filled' : 'solid';
    const fillcolor = isCurrent ? '"#fde047"' : 'white'; // Amarillo Tailwind si es actual
    const color = isCurrent ? '"#ca8a04"' : 'black';

    dot += `  "${state}" [shape=${shape}, style=${style}, fillcolor=${fillcolor}, color=${color}];\n`;
  }

  // Flecha inicial
  dot += `  __start -> "${dfa.initialState}";\n\n`;

  // Transiciones
  for (const fromState in dfa.transitions) {
    const stateTransitions = dfa.transitions[fromState];
    
    // Agrupar símbolos que van al mismo destino para no dibujar flechas duplicadas
    const destMap = new Map<string, string[]>();
    for (const symbol in stateTransitions) {
      const toState = stateTransitions[symbol];
      if (!destMap.has(toState)) destMap.set(toState, []);
      destMap.get(toState)!.push(symbol);
    }

    for (const [toState, symbols] of destMap.entries()) {
      const label = symbols.join(', ');
      
      // Verificar si esta es la transición que se acaba de ejecutar
      const isActive = activeTransition?.from === fromState && 
                       activeTransition?.to === toState && 
                       symbols.includes(activeTransition.symbol);

      const color = isActive ? '"#ef4444"' : 'black'; // Rojo si está activa
      const penwidth = isActive ? '2.5' : '1.0';
      const fontcolor = isActive ? '"#ef4444"' : 'black';

      dot += `  "${fromState}" -> "${toState}" [label="${label}", color=${color}, fontcolor=${fontcolor}, penwidth=${penwidth}];\n`;
    }
  }

  dot += '}';
  return dot;
}