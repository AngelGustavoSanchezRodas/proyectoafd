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
    
    // Debería terminar en Q2, por tanto, rechazada.
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
    expect(result.isValidForSimulation).toBe(true);
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

  it('Debe procesar y simular autómatas con formato de ternas (Origen, Símbolo, Destino)', () => {
    const tripletInput = `Simbolos: 0,1
Estados: P0,P1
Estado inicial: P0
Estados de aceptación: P0,P1
Transiciones:
P0,0,P0
P0,1,P1
P1,0,P1
P1,1,P0
Cadenas a analizar:
0,1,1,0
1,1,1
0,0,0`;

    const dfa = parseDFA(tripletInput);
    expect(dfa.states).toEqual(['P0', 'P1']);
    expect(dfa.symbols).toEqual(['0', '1']);
    expect(dfa.transitions['P0']['0']).toBe('P0');
    expect(dfa.transitions['P0']['1']).toBe('P1');
    expect(dfa.transitions['P1']['0']).toBe('P1');
    expect(dfa.transitions['P1']['1']).toBe('P0');

    const engine = new DFAEngine(dfa);
    const results = engine.evaluateAllStrings();
    // Como ambos estados P0 y P1 son de aceptación, todas las cadenas válidas deben ser aceptadas
    expect(results[0]).toBe('accepted');
    expect(results[1]).toBe('accepted');
    expect(results[2]).toBe('accepted');
  });

  it('Debe identificar transiciones faltantes en autómatas parciales y permitir simulación', () => {
    const partialTripletInput = `Simbolos: 0,1
Estados: A,B,C
Estado inicial: A
Estados de aceptación: C
Transiciones:
A,0,B
B,1,C
C,0,A
C,1,C
Cadenas a analizar:
0,1,0
1,0`;

    const result = parseDFATolerant(partialTripletInput);
    expect(result.dfa.transitions['A']['0']).toBe('B');
    expect(result.dfa.transitions['B']['1']).toBe('C');
    expect(result.dfa.transitions['C']['0']).toBe('A');
    expect(result.dfa.transitions['C']['1']).toBe('C');

    // Debe ser apto para simular con advertencia de función parcial
    expect(result.isValidForSimulation).toBe(true);
    expect(result.warnings.some(w => w.includes('función parcial') || w.includes('Faltan'))).toBe(true);

    const engine = new DFAEngine(result.dfa);
    // Cadena 0: '0,1,0' -> A -(0)-> B -(1)-> C -(0)-> A (termina en A, no es aceptación -> rejected)
    const res0 = engine.evaluateString(0);
    expect(res0.status).toBe('rejected');

    // Cadena 1: '1,0' -> En A no hay transición para '1' -> Rechazada por función parcial
    const res1 = engine.evaluateString(1);
    expect(res1.status).toBe('rejected');
    expect(res1.errorMessage).toContain("Sin transición definida desde 'A' con el símbolo '1'");
  });

  it('Debe inferir estados y alfabeto si el usuario no los declara explícitamente', () => {
    const implicitInput = `Estado inicial: q0
Estados de aceptación: q1
Transiciones:
q0, 0, q1
q1, 1, q0
Cadenas a analizar:
0
01`;

    const dfa = parseDFA(implicitInput);
    expect(dfa.states).toEqual(expect.arrayContaining(['q0', 'q1']));
    expect(dfa.symbols).toEqual(expect.arrayContaining(['0', '1']));
    expect(dfa.initialState).toBe('q0');
    expect(dfa.acceptStates.has('q1')).toBe(true);

    // Cadenas continuas sin comas ("0" y "01")
    expect(dfa.testStrings[0]).toEqual(['0']);
    expect(dfa.testStrings[1]).toEqual(['0', '1']);

    const engine = new DFAEngine(dfa);
    expect(engine.evaluateString(0).status).toBe('accepted');
    expect(engine.evaluateString(1).status).toBe('rejected');
  });

  it('Debe soportar notación funcional, flechas y cadena vacía', () => {
    const functionalInput = `Simbolos: a, b
Estados: S0, S1
Inicial: S0
Finales: S0
Transiciones:
delta(S0, a) = S1
δ(S1, b) = S0
S0 -b-> S0
S1 -> a -> S1
Cadenas a analizar:
ε
ab
ba`;

    const dfa = parseDFA(functionalInput);
    expect(dfa.transitions['S0']['a']).toBe('S1');
    expect(dfa.transitions['S1']['b']).toBe('S0');
    expect(dfa.transitions['S0']['b']).toBe('S0');
    expect(dfa.transitions['S1']['a']).toBe('S1');

    // Cadena vacía ε
    expect(dfa.testStrings[0]).toEqual([]);

    const engine = new DFAEngine(dfa);
    // Cadena vacía en S0 (S0 es final -> accepted)
    expect(engine.evaluateString(0).status).toBe('accepted');
    // 'a, b': S0 -(a)-> S1 -(b)-> S0 (final -> accepted)
    expect(engine.evaluateString(1).status).toBe('accepted');
    // 'b, a': S0 -(b)-> S0 -(a)-> S1 (no final -> rejected)
    expect(engine.evaluateString(2).status).toBe('rejected');
  });

  it('Debe manejar autómatas sin cadenas de prueba sin arrojar excepciones', () => {
    const noStringsInput = `Simbolos: 0, 1
Estados: X, Y
Inicial: X
Finales: Y
X, 0, Y
Y, 1, X`;

    const dfa = parseDFA(noStringsInput);
    expect(dfa.testStrings.length).toBe(0);

    const engine = new DFAEngine(dfa);
    const initialState = engine.initialize(0);
    expect(initialState.status).toBe('idle');
    expect(initialState.currentString).toEqual([]);
    expect(engine.evaluateAllStrings()).toEqual({});
  });

  it('Debe procesar y simular los tres archivos reales subidos por el usuario', () => {
    // Ejemplo 1: Autómata parcial con A, B, C
    const userEx1 = `Simbolos: 0,1
Estados: A,B,C
Estado inicial: A
Estados de aceptación: C
Transiciones:
A,0,B
B,1,C
C,0,A
C,1,C
Cadenas a analizar:
0,1,0
1,1,0
0,1,1,0`;
    const dfa1 = parseDFA(userEx1);
    const engine1 = new DFAEngine(dfa1);
    const results1 = engine1.evaluateAllStrings();
    // 0,1,0: A -(0)-> B -(1)-> C -(0)-> A (A no es final -> rejected)
    expect(results1[0]).toBe('rejected');
    // 1,1,0: En A lee 1 (sin transición -> rejected por función parcial)
    expect(results1[1]).toBe('rejected');
    // 0,1,1,0: A -(0)-> B -(1)-> C -(1)-> C -(0)-> A (A no es final -> rejected)
    expect(results1[2]).toBe('rejected');

    // Ejemplo 3: Autómata completo con P0, P1
    const userEx3 = `Simbolos: 0,1
Estados: P0,P1
Estado inicial: P0
Estados de aceptación: P0,P1
Transiciones:
P0,0,P0
P0,1,P1
P1,0,P1
P1,1,P0
Cadenas a analizar:
0,1,1,0
1,1,1
0,0,0`;
    const dfa3 = parseDFA(userEx3);
    const engine3 = new DFAEngine(dfa3);
    const results3 = engine3.evaluateAllStrings();
    expect(results3[0]).toBe('accepted');
    expect(results3[1]).toBe('accepted');
    expect(results3[2]).toBe('accepted');

    // Ejemplo 4: Autómata parcial con X0, X1, X2
    const userEx4 = `Simbolos: 0,1
Estados: X0,X1,X2
Estado inicial: X0
Estados de aceptación: X1
Transiciones:
X0,1,X1
X1,0,X2
X2,1,X0
X0,0,X0
Cadenas a analizar:
1,0,1
1,1,0
1,0,1,0,1`;
    const dfa4 = parseDFA(userEx4);
    const engine4 = new DFAEngine(dfa4);
    const results4 = engine4.evaluateAllStrings();
    // 1,0,1: X0 -(1)-> X1 -(0)-> X2 -(1)-> X0 (X0 no es final -> rejected)
    expect(results4[0]).toBe('rejected');
    // 1,1,0: X0 -(1)-> X1 lee 1 (sin transición en X1 con 1 -> rejected por función parcial)
    expect(results4[1]).toBe('rejected');
    // 1,0,1,0,1: X0 -(1)-> X1 -(0)-> X2 -(1)-> X0 -(0)-> X0 -(1)-> X1 (X1 es final -> accepted)
    expect(results4[2]).toBe('accepted');
  });
});
