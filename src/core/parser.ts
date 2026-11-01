import { DFA, ParseResult } from '../types/dfa';

export type { ParseResult };

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

function cleanStateName(name: string): string {
  return name.trim().replace(/^(?:->|>|\*)+/, '').replace(/['"]/g, '').trim();
}

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

function parseTestString(rawLine: string, symbols: string[]): string[] {
  let line = rawLine.trim();
  if (!line) return [];

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

export function parseDFATolerant(input: string): ParseResult {
  const cleanInput = input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

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
    const lineWithoutComment = rawLine.split(/(?:\/\/|#|%)/)[0].trim();
    if (!lineWithoutComment) continue;

    const lower = lineWithoutComment.toLowerCase();

    if (/^(?:s[íi]mbolos?|simbolos?|alfabeto|sigma|\u03A3|\u03C3|alphabet|tokens?|entradas?|inputs?)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      symbols = cleanTokens(raw);
    } else if (/^(?:estado\s+inicial|inicial|start\s*(?:state)?|initial\s*(?:state)?|inicio|origen|partida|estado\s+de\s+partida|q_?0)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      const tokens = cleanTokens(raw).map(cleanStateName);
      if (tokens.length > 0) {
        initialState = tokens[0];
        inferredStatesSet.add(initialState);
      }
    } else if (/^(?:estados?\s+de\s+aceptaci[óo]n|aceptaci[óo]n|aceptacion|estados?\s+finales?|finales?|accept\s*(?:states?)?|f|final)\b\s*[:=]/i.test(lower)) {
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
    } else if (/^(?:conjunto\s+de\s+estados|estados?|states?|nodos?|v[ée]rtices?|vertices?|q)\b\s*[:=]/i.test(lower)) {
      const colonIdx = lineWithoutComment.search(/[:=]/);
      const raw = colonIdx !== -1 ? lineWithoutComment.substring(colonIdx + 1) : '';
      states = cleanTokens(raw).map(cleanStateName);
      states.forEach(state => {
        inferredStatesSet.add(state);
        if (!transitions[state]) {
          transitions[state] = {};
        }
      });
    } else if (/^(?:tabla\s+de\s+transiciones?|transiciones?|delta|\u0394|\u03B4|funci[óo]n\s+de\s+transici[óo]n|funcion\s+de\s+transicion|transitions?|reglas?)\s*[:=]?\s*$/i.test(lower)) {
      currentSection = 'transiciones';
      transitionRowIndex = 0;
    } else if (/^(?:cadenas?(\s+a\s+analizar|\s+de\s+prueba|\s+a\s+evaluar)?|strings?|casos\s+de\s+prueba|pruebas?|test\s*(?:strings?)?|palabras?|entradas?|words?|w)\s*[:=]?\s*$/i.test(lower)) {
      currentSection = 'cadenas';
    } else {
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

        if (transitionRowIndex === 0 && symbols.length > 0) {
          const rowTokens = cleanTokens(clean);
          const isHeader = rowTokens.length === symbols.length && rowTokens.every((t, i) => t === symbols[i]);
          if (isHeader) {
            continue;
          }
        }

        // Transicion con flecha: A -0-> B
        const arrowMatch = clean.match(/^([A-Za-z0-9_*-]+)\s*-+\[?\(?([^\s\])]+)\)?\]?-+>\s*([A-Za-z0-9_*-]+)$/);
        if (arrowMatch) {
          const [, from, symGroup, to] = arrowMatch;
          const individualSyms = symGroup.split(/[,/|]/).map(s => s.trim()).filter(Boolean);
          for (const sym of individualSyms) {
            registerTransition(from, sym, to);
          }
          continue;
        }

        // Notacion funcional: delta(A, 0) = B
        const funcMatch = clean.match(/^(?:(?:delta|δ|d)\s*)?\(\s*([A-Za-z0-9_*-]+)\s*[,;]\s*([^,;)]+)\s*\)\s*(?:=|->)?\s*([A-Za-z0-9_*-]+)$/i);
        if (funcMatch) {
          const [, from, symRaw, to] = funcMatch;
          const individualSyms = symRaw.split(/[,/|]/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
          for (const sym of individualSyms) {
            registerTransition(from, sym, to);
          }
          continue;
        }

        // Flechas separadas: A -> 0 -> B
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

        // Formato terna: A, 0, B
        const tripletTokens = clean.replace(/->/g, ',').split(/[,;\t]/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        if (tripletTokens.length === 3) {
          const [fromCandidate, symbolCandidate, toCandidate] = tripletTokens;
          const syms = symbolCandidate.split(/[/|]/).map(s => s.trim()).filter(Boolean);
          for (const s of syms) {
            registerTransition(fromCandidate, s, toCandidate);
          }
          continue;
        }

        // Mapeo con dos puntos: A: 0->B, 1->C
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

        // Formato matricial
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
            warnings.push(`Línea no reconocida en transiciones: '${clean}'.`);
          }
        }
      } else if (currentSection === 'cadenas') {
        const parsedTokens = parseTestString(lineWithoutComment, symbols);
        testStrings.push(parsedTokens);
      }
    }
  }

  // Deduccion de estados si no se definieron explicitamente
  if (states.length === 0 && inferredStatesSet.size > 0) {
    states = Array.from(inferredStatesSet);
    warnings.push(`Estados inferidos a partir de las transiciones: {${states.join(', ')}}.`);
  }

  // Deduccion del alfabeto si no se definio explicitamente
  if (symbols.length === 0 && inferredSymbolsSet.size > 0) {
    symbols = Array.from(inferredSymbolsSet);
    warnings.push(`Alfabeto inferido a partir de las transiciones: {${symbols.join(', ')}}.`);
  }

  // Estado inicial por defecto si se omitio
  if (!initialState && states.length > 0) {
    initialState = states[0];
    warnings.push(`Estado inicial asignado por defecto: '${initialState}'.`);
  }

  // Incorporar estados referenciados en transiciones
  inferredStatesSet.forEach(st => {
    if (!states.includes(st)) {
      states.push(st);
      warnings.push(`El estado '${st}' fue agregado al conjunto de estados.`);
    }
  });

  states.forEach(st => {
    if (!transitions[st]) {
      transitions[st] = {};
    }
  });

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
    warnings.push(`Función de transición parcial: Faltan ${missingTransitions.length} transiciones (${missingTransitions.join(', ')}).`);
  }

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
