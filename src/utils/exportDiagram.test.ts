// src/utils/exportDiagram.test.ts
import { describe, it, expect } from 'vitest';
import { getDiagramFileName, getSvgDimensions } from './exportDiagram';

describe('Utilidad de exportación de diagramas (exportDiagram)', () => {
  describe('Generación de nombres de archivo (getDiagramFileName)', () => {
    it('Debe generar nombre por defecto si la base es indefinida o vacía', () => {
      expect(getDiagramFileName(undefined, 'svg')).toBe('diagrama_automata.svg');
      expect(getDiagramFileName('', 'png')).toBe('diagrama_automata.png');
      expect(getDiagramFileName('   ', 'svg')).toBe('diagrama_automata.svg');
    });

    it('Debe limpiar la extensión original y añadir sufijo de diagrama con formato', () => {
      expect(getDiagramFileName('par_de_ceros.txt', 'svg')).toBe('par_de_ceros_diagrama.svg');
      expect(getDiagramFileName('automata_binario.txt', 'png')).toBe('automata_binario_diagrama.png');
    });

    it('Debe sanitizar caracteres especiales y espacios en el nombre', () => {
      expect(getDiagramFileName('Autómata Final #1!.txt', 'svg')).toBe('aut_mata_final_1_diagrama.svg');
      expect(getDiagramFileName('mi modelo 2026', 'png')).toBe('mi_modelo_2026_diagrama.png');
    });
  });

  describe('Cálculo de dimensiones lógicas SVG (getSvgDimensions)', () => {
    it('Debe extraer dimensiones a partir del atributo viewBox', () => {
      const mockSvg = {
        getAttribute: (name: string) => {
          if (name === 'viewBox') return '0 0 520.5 340.2';
          return null;
        }
      };
      const dims = getSvgDimensions(mockSvg);
      expect(dims.width).toBe(520.5);
      expect(dims.height).toBe(340.2);
    });

    it('Debe extraer dimensiones a partir de width y height si no hay viewBox', () => {
      const mockSvg = {
        getAttribute: (name: string) => {
          if (name === 'width') return '600px';
          if (name === 'height') return '400';
          return null;
        }
      };
      const dims = getSvgDimensions(mockSvg);
      expect(dims.width).toBe(600);
      expect(dims.height).toBe(400);
    });

    it('Debe usar getBoundingClientRect si los atributos no están presentes', () => {
      const mockSvg = {
        getAttribute: () => null,
        getBoundingClientRect: () => ({ width: 450, height: 250 })
      };
      const dims = getSvgDimensions(mockSvg);
      expect(dims.width).toBe(450);
      expect(dims.height).toBe(250);
    });

    it('Debe recurrir a dimensiones por defecto cuando no hay ninguna información disponible', () => {
      const mockSvg = {
        getAttribute: () => null
      };
      const dims = getSvgDimensions(mockSvg);
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
    });
  });
});

