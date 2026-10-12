// src/core/engine.ts
import { DFA, SimulationState, SimulationStep, SimulationStatus } from '../types/dfa';

export class DFAEngine {
  private dfa: DFA;

  constructor(dfa: DFA) {
    this.dfa = dfa;
  }

  /**
   * Prepara la simulación para una cadena específica.
   */
  public initialize(stringIndex: number): SimulationState {
    if (stringIndex < 0 || stringIndex >= this.dfa.testStrings.length) {
      throw new Error("Índice de cadena inválido.");
    }

    const initialStep: SimulationStep = {
      currentState: this.dfa.initialState,
      symbolRead: null,
      transitionUsed: null,
      stringIndex: -1 // -1 significa que aún no hemos leído el símbolo 0
    };

    return {
      dfa: this.dfa,
      currentString: this.dfa.testStrings[stringIndex],
      status: 'idle',
      history: [initialStep],
      currentStepIndex: 0
    };
  }

  /**
   * Avanza la simulación consumiendo exactamente un símbolo.
   */
  public stepForward(state: SimulationState): SimulationState {
    // Si ya terminó o hay error, no hacemos nada
    if (state.status === 'accepted' || state.status === 'rejected' || state.status === 'error') {
      return state;
    }

    const currentStep = state.history[state.currentStepIndex];
    const nextStringIndex = currentStep.stringIndex + 1;

    // ¿La cadena está vacía? Evaluamos el estado inicial directamente.
    if (state.currentString.length === 0) {
      const isAccepted = this.dfa.acceptStates.has(currentStep.currentState);
      return { ...state, status: isAccepted ? 'accepted' : 'rejected' };
    }

    const symbol = state.currentString[nextStringIndex];
    
    // Validación: Símbolo ajeno al alfabeto
    if (!this.dfa.symbols.includes(symbol)) {
      return {
        ...state,
        status: 'error',
        errorMessage: `El símbolo '${symbol}' no pertenece al alfabeto del AFD.`
      };
    }

    const nextStateName = this.dfa.transitions[currentStep.currentState][symbol];
    
    // Transición inexistente (aunque en un AFD válido siempre debería existir)
    if (!nextStateName) {
      return {
        ...state,
        status: 'error',
        errorMessage: `No hay transición desde '${currentStep.currentState}' con símbolo '${symbol}'.`
      };
    }

    const nextStep: SimulationStep = {
      currentState: nextStateName,
      symbolRead: symbol,
      transitionUsed: { from: currentStep.currentState, symbol, to: nextStateName },
      stringIndex: nextStringIndex
    };

    // Cortar el historial si habíamos retrocedido y ahora avanzamos de nuevo
    const newHistory = state.history.slice(0, state.currentStepIndex + 1);
    newHistory.push(nextStep);

    // Determinar si terminamos de leer la cadena
    const isFinished = nextStringIndex === state.currentString.length - 1;
    let newStatus: SimulationStatus = 'running';
    
    if (isFinished) {
      newStatus = this.dfa.acceptStates.has(nextStateName) ? 'accepted' : 'rejected';
    }

    return {
      ...state,
      status: newStatus,
      history: newHistory,
      currentStepIndex: state.currentStepIndex + 1
    };
  }

  /**
   * Retrocede una operación restaurando el estado previo.
   */
  public stepBackward(state: SimulationState): SimulationState {
    if (state.currentStepIndex === 0) return state; // Ya estamos en el inicio

    return {
      ...state,
      status: state.currentStepIndex - 1 === 0 ? 'idle' : 'running',
      currentStepIndex: state.currentStepIndex - 1,
      errorMessage: undefined // Limpiar errores si retrocedemos
    };
  }
}