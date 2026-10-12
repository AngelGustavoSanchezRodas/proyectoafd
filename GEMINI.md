# Reglas de Desarrollo para Modelos de IA (Antigravity / Gemini)

Este documento define las directrices obligatorias, estándares de ingeniería y restricciones que cualquier agente o modelo de IA debe seguir al operar en este repositorio.

---

## 1. Prohibición Absoluta de Emojis
- No utilizar emojis bajo ninguna circunstancia.
- Esta restricción aplica a respuestas de chat, mensajes de commit, comentarios en el código, documentación técnica, cadenas de texto en la interfaz de usuario (UI), mensajes de error y nombres de pruebas.
- Mantener en todo momento una comunicación técnica, sobria, profesional y directa.

---

## 2. Cero Alucinaciones y Verificación Rigurosa
- Antes de proponer o modificar código, inspeccionar siempre los archivos reales del proyecto, sus rutas, tipos de TypeScript y dependencias en package.json.
- No asumir que una librería, módulo, método o configuración existe sin haber comprobado su presencia en el repositorio.
- Siempre comprobar que el código compila y pasa las pruebas pertinentes (ejecutar `pnpm test` y `pnpm build` o validaciones de tipos) antes de dar por resuelta una solicitud.
- Si falta información o un requerimiento es ambiguo, plantear la duda con precisión técnica en lugar de inventar o inferir comportamiento no sustentado.

---

## 3. Soluciones Definitivas (Cero Parches o Workarounds)
- Resolver siempre la causa raíz de los problemas. No aplicar soluciones provisionales, trucos superficiales ni parches rápidos.
- Prohibido suprimir advertencias o errores del compilador usando directivas como `// @ts-ignore`, `// @ts-nocheck` o forzando tipos mediante `as any` sin una justificación de interoperabilidad insalvable y explícita.
- Respetar la arquitectura modular del proyecto:
  - `src/core/`: Motores de ejecución y parseo puros, desacoplados del framework y testeables de forma aislada.
  - `src/types/`: Definición estricta de interfaces y tipos de dominio.
  - `src/utils/`: Funciones auxiliares reutilizables.
  - `src/components/` y `app/`: Componentes y vistas de la interfaz de usuario.

---

## 4. Convenciones de Idioma: Uso del Español
- Idioma de interacción: Todas las respuestas, explicaciones y razonamientos deben estar redactados en Español.
- Interfaz de Usuario (UI): Botones, títulos, descripciones, leyendas, avisos y etiquetas deben estar en Español.
- Mensajes de error y validaciones: Excepciones lanzadas (`throw new Error(...)`) y textos mostrados al usuario deben redactarse en Español claro y formal.
- Pruebas unitarias: Las descripciones en suites (`describe`) y casos (`it` / `test`) deben estar en Español (ej. `Debe aceptar la primera cadena`).
- Comentarios de código: Breves, pertinentes y en Español.
- Identificadores de código: Se permite el uso de términos técnicos estandarizados en inglés para nombres de variables, funciones y tipos (ej. `parseDFA`, `SimulationState`, `stepForward`, `transitions`), siguiendo la convención ya existente en el repositorio. Evitar anglicismos innecesarios en la lógica de negocio y no mezclar idiomas arbitrariamente.

---

## 5. Tipado Estricto en TypeScript
- No recurrir al tipo `any`. Utilizar tipos genéricos, interfaces bien definidas, tipos unión o `unknown` con validación de tipo cuando sea apropiado.
- Tipar explícitamente parámetros y retornos de funciones públicas y métodos del motor.
- Mantener sincronizados los tipos del dominio en `src/types/dfa.ts` ante cualquier cambio de modelo de datos.

---

## 6. Rigor en la Teoría Formal de Autómatas (AFD)
- Toda modificación o extensión al motor debe apegarse estrictamente a la definición formal de un Autómata Finito Determinista:
  - Alfabeto ($\Sigma$) y conjunto de estados ($Q$) finitos y bien delimitados.
  - Función de transición determinista y total $\delta: Q \times \Sigma \to Q$.
  - Estado inicial único $q_0 \in Q$.
  - Conjunto de estados de aceptación $F \subseteq Q$.
- Inmutabilidad en la simulación: La estructura de estados de la simulación (`SimulationState`) debe mantener la inmutabilidad de su historial para garantizar la fidelidad del mecanismo de Time-Travel (retroceder y avanzar pasos sin corrupción de estado).

---

## 7. Rendimiento, Dependencias y Limpieza de Código
- No añadir nuevas dependencias a package.json a menos que sea estrictamente indispensable y solicitado.
- No dejar código comentado, funciones en desuso (código muerto) ni declaraciones `console.log` de depuración en versiones finales.
- En Next.js, usar la directiva `"use client"` únicamente en componentes que requieran interactividad del navegador o consumo de APIs específicas del cliente (como `@hpcc-js/wasm`).
