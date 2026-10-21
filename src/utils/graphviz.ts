// src/utils/graphviz.ts
import { DFA, SimulationState } from '../types/dfa';

export function generateDotCode(simulation: SimulationState | null, baseDfa: DFA | null, isDarkMode: boolean = false): string {
  const dfa = simulation?.dfa || baseDfa;
  if (!dfa) return '';

  const currentStep = simulation?.history[simulation.currentStepIndex];
  const currentState = currentStep?.currentState;
  const activeTransition = currentStep?.transitionUsed;

  // Paletas de color dinámicas según el tema
  const defaultStroke = isDarkMode ? '"#94a3b8"' : 'black'; // slate-400 o negro
  const defaultText = isDarkMode ? '"#e2e8f0"' : 'black'; // slate-200 o negro
  const defaultFill = isDarkMode ? '"#1e293b"' : 'white'; // slate-800 o blanco

  let dot = 'digraph DFA {\n';
  dot += '  graph [rankdir=LR, bgcolor="transparent", pad="0.3", nodesep="0.6", ranksep="0.7"];\n';
  dot += `  node [fontname="Arial", fontsize=12, color=${defaultStroke}, fontcolor=${defaultText}];\n`;
  dot += `  edge [fontname="Arial", fontsize=10, color=${defaultStroke}, fontcolor=${defaultText}];\n\n`;

  dot += '  __start [shape=none, label="", width=0, height=0];\n';

  for (const state of dfa.states) {
    const isAccept = dfa.acceptStates.has(state);
    const isCurrent = state === currentState;

    const shape = isAccept ? 'doublecircle' : 'circle';
    const style = isCurrent ? 'filled' : 'filled';
    const fillcolor = isCurrent ? '"#fde047"' : defaultFill; // Amarillo si es actual
    const color = isCurrent ? '"#ca8a04"' : defaultStroke;
    const fontcolor = isCurrent ? 'black' : defaultText;

    dot += `  "${state}" [shape=${shape}, style=${style}, fillcolor=${fillcolor}, color=${color}, fontcolor=${fontcolor}];\n`;
  }

  dot += `  __start -> "${dfa.initialState}" [color=${defaultStroke}];\n\n`;

  for (const fromState in dfa.transitions) {
    const stateTransitions = dfa.transitions[fromState];
    const destMap = new Map<string, string[]>();
    
    for (const symbol in stateTransitions) {
      const toState = stateTransitions[symbol];
      if (!destMap.has(toState)) destMap.set(toState, []);
      destMap.get(toState)!.push(symbol);
    }

    for (const [toState, symbols] of destMap.entries()) {
      const label = symbols.join(', ');
      const isActive = activeTransition?.from === fromState && 
                       activeTransition?.to === toState && 
                       symbols.includes(activeTransition.symbol);

      const edgeColor = isActive ? '"#ef4444"' : defaultStroke; 
      const edgeFont = isActive ? '"#ef4444"' : defaultText;
      const penwidth = isActive ? '2.5' : '1.0';

      dot += `  "${fromState}" -> "${toState}" [label="${label}", color=${edgeColor}, fontcolor=${edgeFont}, penwidth=${penwidth}];\n`;
    }
  }

  dot += '}';
  return dot;
}