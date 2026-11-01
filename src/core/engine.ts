import { DFA, SimulationState, SimulationStep, SimulationStatus } from '../types/dfa';

export class DFAEngine {
  private dfa: DFA;

  constructor(dfa: DFA) {
    this.dfa = dfa;
  }

  public initialize(stringIndex: number = 0): SimulationState {
    let currentString: string[] = [];

    if (this.dfa.testStrings && this.dfa.testStrings.length > 0) {
      if (stringIndex < 0 || stringIndex >= this.dfa.testStrings.length) {
        throw new Error("Índice de cadena fuera de rango.");
      }
      currentString = this.dfa.testStrings[stringIndex];
    }

    const initialStep: SimulationStep = {
      currentState: this.dfa.initialState,
      symbolRead: null,
      transitionUsed: null,
      stringIndex: -1
    };

    return {
      dfa: this.dfa,
      currentString,
      status: 'idle',
      history: [initialStep],
      currentStepIndex: 0
    };
  }

  public stepForward(state: SimulationState): SimulationState {
    if (state.status === 'accepted' || state.status === 'rejected' || state.status === 'error') {
      return state;
    }

    const currentStep = state.history[state.currentStepIndex];
    const nextStringIndex = currentStep.stringIndex + 1;

    if (state.currentString.length === 0) {
      const isAccepted = this.dfa.acceptStates.has(currentStep.currentState);
      return { ...state, status: isAccepted ? 'accepted' : 'rejected' };
    }

    const symbol = state.currentString[nextStringIndex];
    
    if (!this.dfa.symbols.includes(symbol)) {
      return {
        ...state,
        status: 'error',
        errorMessage: `El símbolo '${symbol}' no pertenece al alfabeto del autómata.`
      };
    }

    const nextStateName = this.dfa.transitions[currentStep.currentState]?.[symbol];
    
    if (!nextStateName) {
      const haltStep: SimulationStep = {
        currentState: currentStep.currentState,
        symbolRead: symbol,
        transitionUsed: null,
        stringIndex: nextStringIndex
      };

      const newHistory = state.history.slice(0, state.currentStepIndex + 1);
      newHistory.push(haltStep);

      return {
        ...state,
        status: 'rejected',
        errorMessage: `Sin transición definida desde '${currentStep.currentState}' con el símbolo '${symbol}'.`,
        history: newHistory,
        currentStepIndex: state.currentStepIndex + 1
      };
    }

    const nextStep: SimulationStep = {
      currentState: nextStateName,
      symbolRead: symbol,
      transitionUsed: { from: currentStep.currentState, symbol, to: nextStateName },
      stringIndex: nextStringIndex
    };

    const newHistory = state.history.slice(0, state.currentStepIndex + 1);
    newHistory.push(nextStep);

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

  public stepBackward(state: SimulationState): SimulationState {
    if (state.currentStepIndex === 0) return state;

    return {
      ...state,
      status: state.currentStepIndex - 1 === 0 ? 'idle' : 'running',
      currentStepIndex: state.currentStepIndex - 1,
      errorMessage: undefined
    };
  }

  public evaluateString(stringIndex: number): SimulationState {
    let state = this.initialize(stringIndex);
    while (state.status === 'idle' || state.status === 'running') {
      state = this.stepForward(state);
    }
    return state;
  }

  public evaluateAllStrings(): Record<number, 'accepted' | 'rejected' | 'error'> {
    const results: Record<number, 'accepted' | 'rejected' | 'error'> = {};
    for (let i = 0; i < this.dfa.testStrings.length; i++) {
      const finalState = this.evaluateString(i);
      results[i] = finalState.status as 'accepted' | 'rejected' | 'error';
    }
    return results;
  }
}
