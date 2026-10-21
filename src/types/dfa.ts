// src/types/dfa.ts

/**
 * Representación matemática y estructural del AFD.
 */
export interface DFA {
  symbols: string[];
  states: string[];
  initialState: string;
  // Usamos un Set para validaciones ultrarrápidas de O(1) al finalizar la cadena
  acceptStates: Set<string>;
  
  /**
   * Matriz de transiciones implícita resuelta.
   * Estructura: { estadoOrigen: { simboloLeido: estadoDestino } }
   * Ejemplo: { "Q0": { "0": "Q2", "1": "Q1" } }
   */
  transitions: Record<string, Record<string, string>>;
  
  // Guardamos las cadenas como arreglos de símbolos para evitar errores 
  // si un símbolo tiene más de un carácter (ej. "10" como un solo símbolo).
  testStrings: string[][];
}

/**
 * Representa el estado de una transición específica durante la ejecución.
 */
export interface TransitionRecord {
  from: string;
  symbol: string;
  to: string;
}

/**
 * Representa una "foto" de la ejecución en un paso específico.
 * Vital para la función de "Paso anterior" e historial.
 */
export interface SimulationStep {
  currentState: string;
  symbolRead: string | null;
  transitionUsed: TransitionRecord | null;
  stringIndex: number;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'accepted' | 'rejected' | 'error';

/**
 * Estado global del motor de simulación.
 */
export interface SimulationState {
  dfa: DFA | null;
  currentString: string[];
  status: SimulationStatus;
  history: SimulationStep[];
  currentStepIndex: number;
  errorMessage?: string;
}

/**
 * Resultado estructurado del análisis sintáctico y semántico de un autómata.
 */
export interface ParseResult {
  dfa: DFA;
  error: string | null;
  warnings: string[];
  isValidForSimulation: boolean;
}