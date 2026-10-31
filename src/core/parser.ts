// src/core/parser.ts
import { DFA, ParseResult } from '../types/dfa';

export type { ParseResult };

/**
 * Limpia y extrae tokens individuales eliminando llaves, corchetes, comillas y delimitadores.
 */
function cleanTokens(raw: string): string[] {
  const noEnclosing = raw.replace(/[{}[\]()]/g, ' ').trim();
  if (!noEnclosing) return [];

  if (noEnclosing.includes(',') || noEnclosing.includes(';')) {
    return noEnclosing
      .split(/[,;]/)
      .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  return noEnclosing
    .split(/\s+/)
    .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/**
 * Limpia el nombre de un estado removiendo marcadores convencionales como flechas o asteriscos.
 */
function cleanStateName(name: string): string {
  return name.trim().replace(/^(?:->|>|\*)+/, '').replace(/['"]/g, '').trim();
}

/**
 * Comprueba si una cadena representa un estado trampa, nulo o transición vacía.
 */
function isNullOrTrapDestination(dest: string): boolean {
  const lower = dest.toLowerCase().trim();
  return (
    lower === '-' ||
    lower === '--' ||
    lower === '_' ||
    lower === 'none' ||
    lower === 'null' ||
    lower === 'trap' ||
    lower === 'trampa' ||
    lower === 'error' ||
    lower === 'ø' ||
    lower === '∅' ||
    lower === 'vacio' ||
    lower === 'vacío' ||
    lower === '{}'
  );
}

/**
 * Descompone una línea de cadena a analizar tolerando comas, espacios, cadenas pegadas o epsilon.
 */
function parseTestString(rawLine: string, symbols: string[]): string[] {
  let line = rawLine.trim();
  if (!line) return [];

  // Quitar comillas externas si abarcan toda la cadena
  if ((line.startsWith('"') && line.endsWith('"')) || (line.startsWith("'") && line.endsWith("'"))) {
    line = line.substring(1, line.length - 1).trim();
  }

  const lower = line.toLowerCase();
  if (
    line === '' ||
    lower === 'ε' ||
    lower === 'λ' ||
    lower === 'lambda' ||
    lower === 'epsilon' ||
    lower === '""' ||
    lower === "''" ||
    lower === '(vacia)' ||
    lower === '(vacía)' ||
    lower === 'empty' ||
    lower === 'vacio' ||
    lower === 'vacío'
  ) {
    return [];
  }

  if (line.includes(',') || line.includes(';')) {
    const tokens = line.split(/[,;]/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    if (tokens.length === 1) {
      const single = tokens[0].toLowerCase();
      if (single === 'ε' || single === 'λ' || single === 'lambda' || single === 'epsilon' || single === '""' || single === "''") {
        return [];
      }
    }
    return tokens;
  }

  if (/\s+/.test(line)) {
    return line.split(/\s+/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }

  // Si es una palabra continua sin separadores (ej. "010" o "1101")
  const allSingleChar = symbols.length > 0 && symbols.every(s => s.length === 1);
  if (allSingleChar) {
    return line.split('').filter(ch => !/\s/.test(ch));
  }

  const sortedSymbols = [...symbols].sort((a, b) => b.length - a.length);
  const result: string[] = [];
  let remaining = line;
  while (remaining.length > 0) {
    const match = sortedSymbols.find(sym => remaining.startsWith(sym));
    if (match) {
      result.push(match);
      remaining = remaining.substring(match.length);
    } else {
      result.push(remaining[0]);
      remaining = remaining.substring(1);
    }
  }
  return result;
}

/**
 * Analizador sintáctico tolerante y de máxima resiliencia para definiciones formales de AFD.
 */
export function parseDFATolerant(input: string): ParseResult {
  // Limpieza de caracteres BOM y normalización de saltos de línea
  const cleanInput = input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remover comentarios de bloque /* ... */

  const rawLines = cleanInput.split('\n');

  let symbols: string[] = [];
  let states: string[] = [];
  let initialState = '';
  const acceptStates = new Set<string>();
  const transitions: Record<string, Record<string, string>> = {};
  const testStrings: string[][] = [];
  const warnings: string[] = [];

  let currentSection = '';
  let transitionRowIndex = 0;
  const inferredStatesSet = new Set<string>();
  const inferredSymbolsSet = new Set<string>();

  const registerTransition = (fromRaw: string, symbolRaw: string, toRaw: string) => {
    const from = cleanStateName(fromRaw);
    const sym = symbolRaw.trim().replace(/^['"]|['"]$/g, '');
    const to = cleanStateName(toRaw);

    if (!from || !sym || !to) return;
    if (isNullOrTrapDestination(to)) return;

    inferredStatesSet.add(from);
    inferredStatesSet.add(to);
    inferredSymbolsSet.add(sym);

    if (!transitions[from]) {
      transitions[from] = {};
    }
    transitions[from][sym] = to;
  };

  for (const rawLine of rawLines) {
    // Remover comentarios de fin de línea: //, #, %
    const lineWithoutComment = rawLine.split(/(?:\/\/|#|%)/)[0].trim();
    if (!lineWithoutComment) continue;

    const lower = lineWithoutComment.toLowerCase();

    // Detección de encabezado de Alfabeto / Símbolos
    if (/^(?:s[íi]mbolos?|simbolos?|alfabeto|sigma|\u03A3|\u03C3|alphabet|tokens?|entradas?|inputs?)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      symbols = cleanTokens(raw);
    }
    // Detección de encabezado de Estado Inicial
    else if (/^(?:estado\s+inicial|inicial|start\s*(?:state)?|initial\s*(?:state)?|inicio|origen|partida|estado\s+de\s+partida|q_?0)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      const tokens = cleanTokens(raw).map(cleanStateName);
      if (tokens.length > 0) {
        initialState = tokens[0];
        inferredStatesSet.add(initialState);
      }
    }
    // Detección de encabezado de Estados de Aceptación / Finales
    else if (/^(?:estados?\s+de\s+aceptaci[óo]n|aceptaci[óo]n|aceptacion|estados?\s+finales?|finales?|accept\s*(?:states?)?|f|final)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      const tokens = cleanTokens(raw);
      const filtered = tokens
        .filter(t => !/^(?:ninguno|ninguna|vacio|vac[íi]o|\u2205|none|empty|\{\})$/i.test(t))
        .map(cleanStateName);
      filtered.forEach(s => {
        acceptStates.add(s);
        inferredStatesSet.add(s);
      });
    }
    // Detección de encabezado de Conjunto de Estados (Q)
    else if (/^(?:conjunto\s+de\s+estados|estados?|states?|nodos?|v[ée]rtices?|vertices?|q)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      states = cleanTokens(raw).map(cleanStateName);
      states.forEach(state => {
        inferredStatesSet.add(state);
        if (!transitions[state]) {
          transitions[state] = {};
        }
      });
    }
    // Detección de sección de Transiciones
    else if (/^(?:tabla\s+de\s+transiciones?|transiciones?|delta|\u0394|\u03B4|funci[óo]n\s+de\s+transici[óo]n|funcion\s+de\s+transicion|transitions?|reglas?)\s*[:=]?\s*$/i.test(lower)) {
      currentSection = 'transiciones';
      transitionRowIndex = 0;
    }
    // Detección de sección de Cadenas de Prueba
    else if (/^(?:cadenas?(\s+a\s+analizar|\s+de\s+prueba|\s+a\s+evaluar)?|strings?|casos\s+de\s+prueba|pruebas?|test\s*(?:strings?)?|palabras?|entradas?|words?|w)\s*[:=]?\s*$/i.test(lower)) {
      currentSection = 'cadenas';
    }
    // Procesamiento de líneas de datos
    else {
      // Inferencia reactiva de sección si no se declaró explícitamente "Transiciones:"
      if (currentSection !== 'cadenas') {
        const looksLikeTransition =
          lineWithoutComment.includes('->') ||
          /^(?:(?:delta|δ|d)\s*)?\(.+\)/i.test(lineWithoutComment) ||
          (lineWithoutComment.includes(':') && (lineWithoutComment.includes('->') || lineWithoutComment.includes('='))) ||
          cleanTokens(lineWithoutComment).length >= 3;

        if (looksLikeTransition && currentSection === '') {
          currentSection = 'transiciones';
        }
      }

      if (currentSection === 'transiciones') {
        const clean = lineWithoutComment;

        // Si la primera fila bajo transiciones coincide exactamente con los símbolos del alfabeto, ignorar encabezado
        if (transitionRowIndex === 0 && symbols.length > 0) {
          const rowTokens = cleanTokens(clean);
          const isHeader = rowTokens.length === symbols.length && rowTokens.every((t, i) => t === symbols[i]);
          if (isHeader) {
            continue;
          }
        }

        // 1. Patrón flecha incrustada: "A -0-> B", "A --0--> B", "A -[0]-> B", "A -(0)-> B"
        const arrowMatch = clean.match(/^([A-Za-z0-9_*-]+)\s*-+\[?\(?([^\s\])]+)\)?\]?-+>\s*([A-Za-z0-9_*-]+)$/);
        if (arrowMatch) {
          const [, from, symGroup, to] = arrowMatch;
          const individualSyms = symGroup.split(/[,/|]/).map(s => s.trim()).filter(Boolean);
          for (const sym of individualSyms) {
            registerTransition(from, sym, to);
          }
          continue;
        }

        // 2. Patrón notación funcional: "delta(A, 0) = B", "δ(A, 0) = B", "(A, 0) = B", "(A, 0) -> B", "d(A, 0) = B"
        const funcMatch = clean.match(/^(?:(?:delta|δ|d)\s*)?\(\s*([A-Za-z0-9_*-]+)\s*[,;]\s*([^,;)]+)\s*\)\s*(?:=|->)?\s*([A-Za-z0-9_*-]+)$/i);
        if (funcMatch) {
          const [, from, symRaw, to] = funcMatch;
          const individualSyms = symRaw.split(/[,/|]/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
          for (const sym of individualSyms) {
            registerTransition(from, sym, to);
          }
          continue;
        }

        // 3. Patrón flechas separadas: "A -> 0 -> B" o "A, 0 -> B"
        if (clean.includes('->')) {
          const arrowParts = clean.split('->').map(s => s.trim()).filter(Boolean);
          if (arrowParts.length === 3) {
            const [from, sym, to] = arrowParts;
            registerTransition(from, sym, to);
            continue;
          } else if (arrowParts.length === 2 && arrowParts[0].includes(',')) {
            const leftTokens = arrowParts[0].split(',').map(s => s.trim()).filter(Boolean);
            if (leftTokens.length === 2) {
              registerTransition(leftTokens[0], leftTokens[1], arrowParts[1]);
              continue;
            }
          }
        }

        // 4. Patrón terna con comas, punto y coma, tabs o espacios: "A, 0, B"
        const tripletTokens = clean.replace(/->/g, ',').split(/[,;\t]/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        if (tripletTokens.length === 3) {
          const [fromCandidate, symbolCandidate, toCandidate] = tripletTokens;
          const syms = symbolCandidate.split(/[/|]/).map(s => s.trim()).filter(Boolean);
          for (const s of syms) {
            registerTransition(fromCandidate, s, toCandidate);
          }
          continue;
        }

        // 5. Patrón mapeo con dos puntos: "A: 0->B, 1->C" o "A: B, C"
        if (clean.includes(':')) {
          const parts = clean.split(':');
          const prefix = cleanStateName(parts[0]);
          const rest = parts.slice(1).join(':').trim();

          if (rest.includes('->') || rest.includes('=')) {
            const pairs = rest.split(/[,;]/).map(s => s.trim()).filter(Boolean);
            for (const pair of pairs) {
              const pairParts = pair.split(/->|=/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
              if (pairParts.length === 2) {
                registerTransition(prefix, pairParts[0], pairParts[1]);
              }
            }
            continue;
          } else {
            const dests = cleanTokens(rest);
            if (symbols.length > 0) {
              dests.forEach((dest, idx) => {
                if (idx < symbols.length) {
                  registerTransition(prefix, symbols[idx], dest);
                }
              });
            }
            continue;
          }
        }

        // 6. Patrón matricial con origen explícito: "Q0, Q2, Q1" o implícito por orden de fila: "Q2, Q1"
        const rawTokens = cleanTokens(clean);
        if (rawTokens.length > 0) {
          let targetState = '';
          let dests: string[] = [];

          if (symbols.length > 0 && rawTokens.length === symbols.length + 1) {
            targetState = cleanStateName(rawTokens[0]);
            dests = rawTokens.slice(1);
          } else {
            if (states.length > 0 && transitionRowIndex < states.length) {
              targetState = states[transitionRowIndex];
              transitionRowIndex++;
            } else if (rawTokens.length > 0 && states.includes(cleanStateName(rawTokens[0]))) {
              targetState = cleanStateName(rawTokens[0]);
              dests = rawTokens.slice(1);
            }
            dests = dests.length > 0 ? dests : rawTokens;
          }

          if (targetState) {
            dests.forEach((dest, idx) => {
              if (symbols.length > 0 && idx < symbols.length) {
                registerTransition(targetState, symbols[idx], dest);
              }
            });
            if (symbols.length > 0 && dests.length > symbols.length) {
              warnings.push(`Fila (${targetState}): Se indicaron ${dests.length} destinos pero el alfabeto define ${symbols.length}.`);
            }
          } else {
            warnings.push(`Línea de transición no estructurada o no reconocida: '${clean}'.`);
          }
        }
      } else if (currentSection === 'cadenas') {
        const parsedTokens = parseTestString(lineWithoutComment, symbols);
        testStrings.push(parsedTokens);
      }
    }
  }

  // --- RECUPERACIÓN RESILIENTE ANTE DECLARACIONES INCOMPLETAS ---
  // 1. Inferencia de estados si no fueron declarados explícitamente
  if (states.length === 0) {
    if (inferredStatesSet.size > 0) {
      states = Array.from(inferredStatesSet);
      warnings.push(`Conjunto de estados no declarado explícitamente; se infirieron automáticamente los estados: {${states.join(', ')}}.`);
    }
  }

  // 2. Inferencia del alfabeto si no fue declarado explícitamente
  if (symbols.length === 0) {
    if (inferredSymbolsSet.size > 0) {
      symbols = Array.from(inferredSymbolsSet);
      warnings.push(`Alfabeto no declarado explícitamente; se infirieron automáticamente los símbolos: {${symbols.join(', ')}}.`);
    }
  }

  // 3. Inferencia de estado inicial si no fue declarado explícitamente
  if (!initialState && states.length > 0) {
    initialState = states[0];
    warnings.push(`Estado inicial no declarado explícitamente; se asumió por defecto '${initialState}'.`);
  }

  // 4. Incorporación resiliente de estados descubiertos en transiciones que no figuraban en 'Estados:'
  inferredStatesSet.forEach(st => {
    if (!states.includes(st)) {
      states.push(st);
      warnings.push(`El estado '${st}' detectado en las transiciones fue incorporado automáticamente al conjunto de estados.`);
    }
  });

  // Asegurar que cada estado tenga su registro en transitions
  states.forEach(st => {
    if (!transitions[st]) {
      transitions[st] = {};
    }
  });

  // Validaciones semánticas
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
      warnings.push(`El estado de aceptación '${s}' no pertenece a los estados declarados.`);
    }
  });

  // Detección pedagógica de transiciones no declaradas (función parcial)
  const missingTransitions: string[] = [];
  states.forEach(state => {
    symbols.forEach(sym => {
      const dest = transitions[state]?.[sym];
      if (!dest) {
        missingTransitions.push(`δ(${state}, ${sym})`);
      }
    });
  });

  if (missingTransitions.length > 0) {
    warnings.push(`Autómata con función parcial: Faltan ${missingTransitions.length} transiciones (${missingTransitions.join(', ')}). Al simular, cualquier transición no definida rechazará la cadena.`);
  }

  // Validación de aptitud para simulación
  const hasFatalErrors =
    states.length === 0 ||
    symbols.length === 0 ||
    !states.includes(initialState);

  const isValidForSimulation = !hasFatalErrors;
  const error = hasFatalErrors ? warnings[0] : (missingTransitions.length > 0 ? warnings[warnings.length - 1] : null);

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
