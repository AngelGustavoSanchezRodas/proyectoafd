// src/utils/examples.ts
export const dfaExamples = [
  {
    id: 1,
    name: 'Ejemplo Base (Curso)',
    description: 'El autómata proporcionado en los requisitos del proyecto.',
    content: `Simbolos: 0,1\nEstados: Q0,Q1,Q2,Q3\nEstado inicial: Q0\nEstados de aceptación: Q0\nTransiciones:\nQ2,Q1\nQ3,Q0\nQ0,Q3\nQ1,Q2\nCadenas a analizar:\n1,0,0,1\n0,0,1,0,1`
  },
  {
    id: 2,
    name: 'Pares de Ceros',
    description: 'Acepta cadenas que contienen un número par de ceros.',
    content: `Simbolos: 0,1\nEstados: Par,Impar\nEstado inicial: Par\nEstados de aceptación: Par\nTransiciones:\nImpar,Par\nPar,Impar\nCadenas a analizar:\n1,1,1\n0,0\n1,0,1,0\n0\n0,1,0,0`
  },
  {
    id: 3,
    name: 'Termina en 10',
    description: 'Acepta cualquier cadena binaria que termine exactamente en la secuencia 1,0.',
    content: `Simbolos: 0,1\nEstados: Inicio,Vio1,Vio10\nEstado inicial: Inicio\nEstados de aceptación: Vio10\nTransiciones:\nInicio,Vio1\nVio10,Vio1\nInicio,Vio1\nCadenas a analizar:\n1,0\n0,0,1,0\n1,0,1\n1,1,1,0\n0,0,0`
  }
];