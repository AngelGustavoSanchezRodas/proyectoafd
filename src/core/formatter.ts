// src/core/formatter.ts
import { parseDFATolerant } from './parser';

/**
 * Ajusta automáticamente el texto de definición de un autómata:
 * 1. Asegura que cada fila de transición contenga exactamente el número de destinos
 *    correspondiente a los símbolos del alfabeto declarado.
 * 2. Si faltan filas de transición para estados declarados, añade filas por defecto.
 * 3. Limpia comas y espacios superfluos al final de las cadenas a analizar.
 */
export function autoAlignDFAText(rawText: string): string {
  if (!rawText.trim()) return rawText;

  const result = parseDFATolerant(rawText);
  const { symbols, states } = result.dfa;
  if (symbols.length === 0 || states.length === 0) return rawText;

  const lines = rawText.split('\n');
  const newLines: string[] = [];
  let inTransitions = false;
  let transitionIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase().trim();

    if (lower.startsWith('transiciones:')) {
      inTransitions = true;
      transitionIdx = 0;
      newLines.push(line);
      continue;
    }

    if (lower.startsWith('cadenas a analizar:') || lower.startsWith('cadenas:')) {
      if (inTransitions) {
        while (transitionIdx < states.length) {
          const st = states[transitionIdx];
          const defaultDests = symbols.map(() => st).join(',');
          newLines.push(defaultDests);
          transitionIdx++;
        }
        inTransitions = false;
      }
      newLines.push(line);
      continue;
    }

    if (inTransitions) {
      if (line.trim() === '') {
        newLines.push(line);
        continue;
      }
      if (transitionIdx < states.length) {
        const rawParts = line.split(',').map(s => s.trim()).filter(Boolean);
        const cleanDests = rawParts.slice(0, symbols.length);
        while (cleanDests.length < symbols.length) {
          cleanDests.push(states[transitionIdx]);
        }
        newLines.push(cleanDests.join(','));
        transitionIdx++;
      }
    } else {
      if (newLines.some(l => l.toLowerCase().startsWith('cadenas a analizar:') || l.toLowerCase().startsWith('cadenas:'))) {
        const cleanTokens = line.split(',').map(s => s.trim()).filter(Boolean);
        if (cleanTokens.length > 0) {
          newLines.push(cleanTokens.join(','));
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
  }

  if (inTransitions) {
    while (transitionIdx < states.length) {
      const st = states[transitionIdx];
      const defaultDests = symbols.map(() => st).join(',');
      newLines.push(defaultDests);
      transitionIdx++;
    }
  }

  return newLines.join('\n');
}
