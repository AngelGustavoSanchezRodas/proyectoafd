// src/core/parser.ts
import { DFA, ParseResult } from '../types/dfa';

export type { ParseResult };

export function parseDFATolerant(input: string): ParseResult {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let symbols: string[] = [];
  let states: string[] = [];
  let initialState = '';
  let acceptStates = new Set<string>();
  const transitions: Record<string, Record<string, string>> = {};
  const testStrings: string[][] = [];
  const warnings: string[] = [];

  let currentSection = '';
  let transitionRowIndex = 0;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.startsWith('simbolos:')) {
      const raw = line.substring(line.indexOf(':') + 1);
      symbols = raw.split(',').map(s => s.trim()).filter(s => s !== '');
    } else if (lowerLine.startsWith('estados:')) {
      const raw = line.substring(line.indexOf(':') + 1);
      states = raw.split(',').map(s => s.trim()).filter(s => s !== '');
      states.forEach(state => { transitions[state] = {}; });
    } else if (lowerLine.startsWith('estado inicial:')) {
      initialState = line.substring(line.indexOf(':') + 1).trim();
    } else if (lowerLine.startsWith('estados de aceptación:') || lowerLine.startsWith('estados de aceptacion:')) {
      const raw = line.substring(line.indexOf(':') + 1);
      const acceptArr = raw.split(',').map(s => s.trim()).filter(s => s !== '');
      acceptStates = new Set(acceptArr);
    } else if (lowerLine.startsWith('transiciones:')) {
      currentSection = 'transiciones';
      transitionRowIndex = 0;
    } else if (lowerLine.startsWith('cadenas a analizar:') || lowerLine.startsWith('cadenas:')) {
      currentSection = 'cadenas';
    } else {
      if (currentSection === 'transiciones') {
        let targetState = '';
        let dests: string[] = [];

        // Soporte para prefijo explícito de estado: "Q0: Q2, Q1" o "Q0 -> Q2, Q1"
        if (line.includes(':')) {
          const parts = line.split(':');
          const prefix = parts[0].trim();
          if (states.includes(prefix)) {
            targetState = prefix;
            dests = parts[1].split(',').map(s => s.trim()).filter(s => s !== '');
          }
        } else if (line.includes('->')) {
          const parts = line.split('->');
          const prefix = parts[0].trim();
          if (states.includes(prefix)) {
            targetState = prefix;
            dests = parts[1].split(',').map(s => s.trim()).filter(s => s !== '');
          }
        }

        // Si no tenía prefijo con dos puntos, verificar si el primer elemento es el estado de origen
        if (!targetState) {
          const rawDests = line.split(',').map(s => s.trim()).filter(s => s !== '');
          if (rawDests.length === symbols.length + 1 && states.includes(rawDests[0])) {
            targetState = rawDests[0];
            dests = rawDests.slice(1);
          } else {
            if (transitionRowIndex < states.length) {
              targetState = states[transitionRowIndex];
              transitionRowIndex++;
            }
            dests = rawDests;
          }
        }

        if (targetState) {
          if (!transitions[targetState]) {
            transitions[targetState] = {};
          }

          if (symbols.length > 0) {
            if (dests.length === symbols.length) {
              symbols.forEach((sym, idx) => {
                transitions[targetState][sym] = dests[idx];
              });
            } else if (dests.length > symbols.length) {
              // Asignar los primeros símbolos para permitir previsualización gráfica en vivo
              symbols.forEach((sym, idx) => {
                transitions[targetState][sym] = dests[idx];
              });
              warnings.push(`Fila (${targetState}): El alfabeto define ${symbols.length} símbolos ({${symbols.join(', ')}}), pero se indicaron ${dests.length} destinos (${dests.join(', ')}). Cada fila debe tener exactamente ${symbols.length} destinos.`);
            } else {
              // Menos destinos de los requeridos
              dests.forEach((dest, idx) => {
                if (idx < symbols.length) {
                  transitions[targetState][symbols[idx]] = dest;
                }
              });
              warnings.push(`Fila (${targetState}): Faltan destinos. Se esperan ${symbols.length} destinos ({${symbols.join(', ')}}), pero solo hay ${dests.length}.`);
            }
          }
        } else {
          warnings.push(`Fila de transición huérfana: '${line}'. Ya se han asignado transiciones para todos los estados declarados.`);
        }
      } else if (currentSection === 'cadenas') {
        const cleanTokens = line.split(',').map(s => s.trim()).filter(s => s !== '');
        if (cleanTokens.length > 0) {
          testStrings.push(cleanTokens);
        }
      }
    }
  }

  // Validaciones semánticas del autómata
  if (states.length === 0) {
    warnings.push("No se han definido estados en el autómata.");
  }
  if (symbols.length === 0) {
    warnings.push("No se han definido símbolos en el alfabeto.");
  }
  if (!initialState) {
    warnings.push("No se ha definido el estado inicial.");
  } else if (!states.includes(initialState)) {
    warnings.push(`El estado inicial '${initialState}' no está en la lista de estados.`);
  }

  acceptStates.forEach(s => {
    if (!states.includes(s)) {
      warnings.push(`El estado de aceptación '${s}' no está en la lista de estados.`);
    }
  });

  // Verificar que todos los estados tengan transiciones completas
  states.forEach(state => {
    symbols.forEach(sym => {
      const dest = transitions[state]?.[sym];
      if (!dest) {
        warnings.push(`El estado '${state}' no tiene transición definida para el símbolo '${sym}'.`);
      } else if (!states.includes(dest)) {
        warnings.push(`El destino '${dest}' desde '${state}' con '${sym}' no pertenece a los estados declarados.`);
      }
    });
  });

  const isValidForSimulation = warnings.length === 0 && states.length > 0 && symbols.length > 0 && states.includes(initialState);
  const error = warnings.length > 0 ? warnings[0] : null;

  return {
    dfa: { symbols, states, initialState, acceptStates, transitions, testStrings },
    error,
    warnings,
    isValidForSimulation
  };
}

export function parseDFA(input: string): DFA {
  const result = parseDFATolerant(input);
  if (!result.isValidForSimulation) {
    throw new Error(result.error || "Definición de autómata no válida.");
  }
  return result.dfa;
}