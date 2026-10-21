// src/utils/explanation.test.ts
import { describe, it, expect } from 'vitest';
import { getStepExplanation } from './explanation';
import { DFA, SimulationState } from '../types/dfa';

describe('Generador de explicaciones técnicas (getStepExplanation)', () => {
  const mockDfa: DFA = {
    symbols: ['0', '1'],
    states: ['Q0', 'Q1'],
    initialState: 'Q0',
    acceptStates: new Set(['Q1']),
    transitions: {
      Q0: { '0': 'Q0', '1': 'Q1' },
      Q1: { '0': 'Q0', '1': 'Q1' }
    },
    testStrings: [['1']]
  };

  it('Debe retornar mensaje de espera si la simulación o el autómata son nulos', () => {
    expect(getStepExplanation(null, null)).toBe('Esperando inicialización del modelo.');
    expect(getStepExplanation(null, mockDfa)).toBe('Esperando inicialización del modelo.');
  });

  it('Debe explicar el estado inicial cuando la simulación está en reposo (idle)', () => {
    const idleSim: SimulationState = {
      dfa: mockDfa,
      currentString: ['1'],
      currentStepIndex: 0,
      history: [{
        currentState: 'Q0',
        symbolRead: null,
        transitionUsed: null,
        stringIndex: -1
      }],
      status: 'idle',
      errorMessage: undefined
    };

    const exp = getStepExplanation(idleSim, mockDfa);
    expect(exp).toContain('Sistema inicializado');
    expect(exp).toContain('Q0');
  });

  it('Debe explicar la transición y el resultado de aceptación al finalizar la cadena', () => {
    const acceptedSim: SimulationState = {
      dfa: mockDfa,
      currentString: ['1'],
      currentStepIndex: 1,
      history: [
        {
          currentState: 'Q0',
          symbolRead: null,
          transitionUsed: null,
          stringIndex: -1
        },
        {
          currentState: 'Q1',
          symbolRead: '1',
          transitionUsed: { from: 'Q0', symbol: '1', to: 'Q1' },
          stringIndex: 0
        }
      ],
      status: 'accepted',
      errorMessage: undefined
    };

    const exp = getStepExplanation(acceptedSim, mockDfa);
    expect(exp).toContain('Transición δ(Q0, \'1\') → Q1');
    expect(exp).toContain('Cadena ACEPTADA');
  });
});
