// src/core/formatter.test.ts
import { describe, it, expect } from 'vitest';
import { autoAlignDFAText } from './formatter';

describe('Alineador automático de formato DFA (autoAlignDFAText)', () => {
  it('Debe recortar transiciones excedentes y rellenar estados faltantes', () => {
    const rawWithExtra = `Simbolos: 0,1
Estados: Q0,Q1,Q2
Estado inicial: Q0
Estados de aceptación: Q2
Transiciones:
Q1,Q2,Q0
Q2
Cadenas a analizar:
0,1,
1,0`;

    const aligned = autoAlignDFAText(rawWithExtra);
    const lines = aligned.split('\n');

    // Debe contener las transiciones ajustadas para 3 estados y 2 símbolos
    const transIndex = lines.findIndex(l => l.toLowerCase().startsWith('transiciones:'));
    expect(transIndex).toBeGreaterThan(-1);

    // Fila 0 (para Q0): de Q1,Q2,Q0 pasa a Q1,Q2
    expect(lines[transIndex + 1]).toBe('Q1,Q2');
    // Fila 1 (para Q1): de Q2 pasa a Q2,Q1
    expect(lines[transIndex + 2]).toBe('Q2,Q1');
    // Fila 2 (para Q2): faltaba, se genera con Q2,Q2
    expect(lines[transIndex + 3]).toBe('Q2,Q2');

    // Las cadenas a analizar deben quedar limpias de comas finales
    const cadenasIndex = lines.findIndex(l => l.toLowerCase().startsWith('cadenas a analizar:'));
    expect(lines[cadenasIndex + 1]).toBe('0,1');
    expect(lines[cadenasIndex + 2]).toBe('1,0');
  });

  it('Debe devolver el texto intacto si está vacío', () => {
    expect(autoAlignDFAText('')).toBe('');
    expect(autoAlignDFAText('   ')).toBe('   ');
  });
});
