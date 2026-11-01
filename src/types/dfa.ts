export interface DFA {
  symbols: string[];
  states: string[];
  initialState: string;
  acceptStates: Set<string>;
  transitions: Record<string, Record<string, string>>;
  testStrings: string[][];
}

export interface TransitionRecord {
  from: string;
  symbol: string;
  to: string;
}

export interface SimulationStep {
  currentState: string;
  symbolRead: string | null;
  transitionUsed: TransitionRecord | null;
  stringIndex: number;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'accepted' | 'rejected' | 'error';

export interface SimulationState {
  dfa: DFA | null;
  currentString: string[];
  status: SimulationStatus;
  history: SimulationStep[];
  currentStepIndex: number;
  errorMessage?: string;
}

export interface ParseResult {
  dfa: DFA;
  error: string | null;
  warnings: string[];
  isValidForSimulation: boolean;
}
