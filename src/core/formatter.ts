import { parseDFATolerant } from './parser';

export function autoAlignDFAText(rawText: string): string {
  if (!rawText.trim()) return rawText;

  const result = parseDFATolerant(rawText);
  const { symbols, states, transitions } = result.dfa;
  if (symbols.length === 0 || states.length === 0) return rawText;

  const lines = rawText.split('\n');
  
  let usesTriplets = false;
  let inTransitionsCheck = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('transiciones:')) {
      inTransitionsCheck = true;
      continue;
    }
    if (lower.startsWith('cadenas a analizar:') || lower.startsWith('cadenas:')) {
      break;
    }
    if (inTransitionsCheck && trimmed) {
      const parts = trimmed.replace(/->/g, ',').split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length === 3 && states.includes(parts[0]) && symbols.includes(parts[1])) {
        usesTriplets = true;
        break;
      }
    }
  }

  const newLines: string[] = [];
  let inTransitions = false;
  let transitionIdx = 0;
  const processedTriplets = new Set<string>();

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
        if (usesTriplets) {
          for (const st of states) {
            for (const sym of symbols) {
              const key = `${st},${sym}`;
              if (!processedTriplets.has(key)) {
                const dest = transitions[st]?.[sym] || st;
                newLines.push(`${st},${sym},${dest}`);
                processedTriplets.add(key);
              }
            }
          }
        } else {
          while (transitionIdx < states.length) {
            const st = states[transitionIdx];
            const defaultDests = symbols.map(() => st).join(',');
            newLines.push(defaultDests);
            transitionIdx++;
          }
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

      if (usesTriplets) {
        const parts = line.replace(/->/g, ',').split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 3 && states.includes(parts[0]) && symbols.includes(parts[1])) {
          const from = parts[0];
          const sym = parts[1];
          const dest = states.includes(parts[2]) ? parts[2] : from;
          const key = `${from},${sym}`;
          if (!processedTriplets.has(key)) {
            newLines.push(`${from},${sym},${dest}`);
            processedTriplets.add(key);
          }
        }
      } else {
        if (transitionIdx < states.length) {
          const rawParts = line.split(',').map(s => s.trim()).filter(Boolean);
          const cleanDests = rawParts.slice(0, symbols.length);
          while (cleanDests.length < symbols.length) {
            cleanDests.push(states[transitionIdx]);
          }
          newLines.push(cleanDests.join(','));
          transitionIdx++;
        }
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
    if (usesTriplets) {
      for (const st of states) {
        for (const sym of symbols) {
          const key = `${st},${sym}`;
          if (!processedTriplets.has(key)) {
            const dest = transitions[st]?.[sym] || st;
            newLines.push(`${st},${sym},${dest}`);
            processedTriplets.add(key);
          }
        }
      }
    } else {
      while (transitionIdx < states.length) {
        const st = states[transitionIdx];
        const defaultDests = symbols.map(() => st).join(',');
        newLines.push(defaultDests);
        transitionIdx++;
      }
    }
  }

  return newLines.join('\n');
}
