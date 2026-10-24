// src/core/engine.test.ts
import { describe, it, expect } from 'vitest';
import { parseDFA, parseDFATolerant } from './parser';
import { DFAEngine } from './engine';

const rawInput = `Simbolos: 0,1
Estados: Q0,Q1,Q2,Q3
Estado inicial: Q0
Estados de aceptación: Q0
Transiciones:
Q2,Q1
Q3,Q0
Q0,Q3
Q1,Q2
Cadenas a analizar:
1,0,0,1
0,0,1,0,1`;

describe('DFA Core Engine', () => {
  it('Debe parsear el archivo correctamente (Matriz Implícita)', () => {
    const dfa = parseDFA(rawInput);
    expect(dfa.symbols).toEqual(['0', '1']);
    expect(dfa.states).toEqual(['Q0', 'Q1', 'Q2', 'Q3']);
    // Probando la deducción de la matriz
    expect(dfa.transitions['Q0']['0']).toBe('Q2');
    expect(dfa.transitions['Q0']['1']).toBe('Q1');
    expect(dfa.transitions['Q3']['0']).toBe('Q1');
  });

  it('Debe aceptar la primera cadena: 1,0,0,1', () => {
    const dfa = parseDFA(rawInput);
    const engine = new DFAEngine(dfa);
    let state = engine.initialize(0); // Cadena 0: 1,0,0,1
    
    // Q0 -(1)-> Q1 -(0)-> Q3 -(0)-> Q1 -(1)-> Q0 (Aceptado)
    state = engine.stepForward(state); // lee 1 -> Q1
    expect(state.history[state.currentStepIndex].currentState).toBe('Q1');
    
    state = engine.stepForward(state); // lee 0 -> Q3
    expect(state.history[state.currentStepIndex].currentState).toBe('Q3');
    
    state = engine.stepForward(state); // lee 0 -> Q1
    state = engine.stepForward(state); // lee 1 -> Q0
    
    expect(state.status).toBe('accepted');
  });

  it('Debe rechazar la segunda cadena: 0,0,1,0,1', () => {
    const dfa = parseDFA(rawInput);
    const engine = new DFAEngine(dfa);
    let state = engine.initialize(1); 
    
    // Simular hasta el final automáticamente para test
    while (state.status === 'idle' || state.status === 'running') {
      state = engine.stepForward(state);
    }
    
    // Debería terminar en Q3, por tanto, rechazada.
    expect(state.status).toBe('rejected');
    expect(state.history[state.currentStepIndex].currentState).toBe('Q2');
  });

  it('Debe permitir retroceder (Time-Travel)', () => {
    const dfa = parseDFA(rawInput);
    const engine = new DFAEngine(dfa);
    let state = engine.initialize(0);
    
    state = engine.stepForward(state); // Q1
    state = engine.stepBackward(state); // Vuelve a Q0
    
    expect(state.currentStepIndex).toBe(0);
    expect(state.history[state.currentStepIndex].currentState).toBe('Q0');
    expect(state.status).toBe('idle');
  });

  it('Debe extraer estados de aceptación y advertencias de forma tolerante durante la edición', () => {
    const inputWithExtraDests = `Simbolos: 0,1
Estados: Q0,Q1,Q2,Q3,Q4
Estado inicial: Q0
Estados de aceptación: Q0, Q4
Transiciones:
Q2,Q1,Q4
Q3,Q0,Q4
Q0,Q3,Q3
Q1,Q2, Q4
Cadenas a analizar:
1,0,0,1
0,0,1,0,1, `;
    const result = parseDFATolerant(inputWithExtraDests);

    expect(result.dfa.states).toEqual(['Q0', 'Q1', 'Q2', 'Q3', 'Q4']);
    expect(result.dfa.acceptStates.has('Q0')).toBe(true);
    expect(result.dfa.acceptStates.has('Q4')).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.isValidForSimulation).toBe(false);
    // Limpieza de cadenas a analizar con comas finales
    expect(result.dfa.testStrings[1]).toEqual(['0', '0', '1', '0', '1']);
  });

  it('Debe evaluar cadenas de forma directa y por lote', () => {
    const dfa = parseDFA(rawInput);
    const engine = new DFAEngine(dfa);

    const singleResult = engine.evaluateString(0);
    expect(singleResult.status).toBe('accepted');

    const allResults = engine.evaluateAllStrings();
    expect(allResults[0]).toBe('accepted');
    expect(allResults[1]).toBe('rejected');
  });
});