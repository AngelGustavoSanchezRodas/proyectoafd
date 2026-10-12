// src/core/parser.ts
import { DFA } from '../types/dfa';

export function parseDFA(input: string): DFA {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let symbols: string[] = [];
  let states: string[] = [];
  let initialState = '';
  let acceptStates = new Set<string>();
  const transitions: Record<string, Record<string, string>> = {};
  const testStrings: string[][] = [];
  
  let currentSection = '';
  let transitionRowIndex = 0;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.startsWith('simbolos:')) {
      symbols = line.substring(9).split(',').map(s => s.trim());
    } else if (lowerLine.startsWith('estados:')) {
      states = line.substring(8).split(',').map(s => s.trim());
      // Inicializar el diccionario de transiciones por cada estado
      states.forEach(state => { transitions[state] = {}; });
    } else if (lowerLine.startsWith('estado inicial:')) {
      initialState = line.substring(15).trim();
    } else if (lowerLine.startsWith('estados de aceptación:')) {
      const acceptArr = line.substring(22).split(',').map(s => s.trim());
      acceptStates = new Set(acceptArr);
    } else if (lowerLine.startsWith('transiciones:')) {
      currentSection = 'transiciones';
      transitionRowIndex = 0;
    } else if (lowerLine.startsWith('cadenas a analizar:')) {
      currentSection = 'cadenas';
    } else {
      // Procesando el contenido debajo de las cabeceras
      if (currentSection === 'transiciones') {
        if (transitionRowIndex < states.length) {
          const dests = line.split(',').map(s => s.trim());
          const currentState = states[transitionRowIndex];
          
          if (dests.length !== symbols.length) {
            throw new Error(`Error en transiciones: El estado ${currentState} debe tener ${symbols.length} destinos, pero tiene ${dests.length}.`);
          }
          
          // Mapear los destinos según el orden de los símbolos (Nuestra regla de negocio)
          symbols.forEach((sym, idx) => {
            transitions[currentState][sym] = dests[idx];
          });
          transitionRowIndex++;
        }
      } else if (currentSection === 'cadenas') {
        testStrings.push(line.split(',').map(s => s.trim()));
      }
    }
  }

  // Validaciones del autómata
  if (!states.includes(initialState)) {
    throw new Error(`Validación fallida: El estado inicial '${initialState}' no está en la lista de estados.`);
  }
  acceptStates.forEach(s => {
    if (!states.includes(s)) {
      throw new Error(`Validación fallida: El estado de aceptación '${s}' no está en la lista de estados.`);
    }
  });

  return { symbols, states, initialState, acceptStates, transitions, testStrings };
}