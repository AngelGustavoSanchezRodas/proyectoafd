# Prompt Maestro AFD

Plataforma web interactiva para la simulación, análisis paso a paso y visualización gráfica de **Autómatas Finitos Deterministas (AFD)**.

Permite cargar la definición formal de un AFD mediante archivos de texto (`.txt`), generar automáticamente su diagrama visual en lenguaje DOT con **Graphviz** (vía WebAssembly), explorar la tabla de transiciones y ejecutar o retroceder la lectura de cadenas símbolo a símbolo (*Time-Travel*).

---

## Requisitos Previos

Asegúrate de contar con lo siguiente instalado en tu sistema:

- **[Node.js](https://nodejs.org/)** (v20.x o superior recomendado)
- **[Git](https://git-scm.com/)**
- **[pnpm](https://pnpm.io/)** (gestor recomendado, v9 o superior) o alternativamente **npm** / **yarn**

---

## Pasos para Clonar y Encender el Proyecto

### 1. Clonar el Repositorio

Abre una terminal y clona el proyecto desde GitHub:

```bash
git clone https://github.com/AngelGustavoSanchezRodas/ProyectoAFD.git
cd ProyectoAFD
```

### 2. Instalar Dependencias

Instala los paquetes del proyecto usando tu gestor preferido (se recomienda `pnpm`):

```bash
pnpm install
```

> *Si utilizas `npm`, ejecuta `npm install`.*

### 3. Encender el Servidor de Desarrollo

Inicia el entorno de desarrollo local con soporte de Turbopack:

```bash
pnpm dev
```

> *Si utilizas `npm`, ejecuta `npm run dev`.*

### 4. Abrir en el Navegador

Una vez que la terminal indique que el servidor está listo, abre tu navegador e ingresa a:

**[http://localhost:3000](http://localhost:3000)**

---

## Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo en `http://localhost:3000`. |
| `pnpm test` | Ejecuta las pruebas unitarias del motor AFD con Vitest. |
| `pnpm test:ui` | Abre la interfaz gráfica interactiva de pruebas de Vitest. |
| `pnpm build` | Compila y optimiza la aplicación para producción. |
| `pnpm start` | Inicia el servidor de producción (requiere previo `pnpm build`). |
| `pnpm lint` | Ejecuta ESLint para verificar el estilo y sintaxis del código. |

---

## Formato del Archivo de Entrada (`.txt`)

El sistema procesa archivos de texto con la definición formal del autómata y las cadenas a validar:

```text
Simbolos: 0,1
Estados: Q0,Q1,Q2,Q3
Estado inicial: Q0
Estados de aceptación: Q0
Transiciones:
Q2,Q1
Q3,Q0
Q0,Q3
Q1,Q2
Cadenas a analizar:
1,0,0,1
0,0,1,0,1
```

---

## Tecnologías Utilizadas

- **Framework Web:** [Next.js](https://nextjs.org/) (App Router & Turbopack)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Librería de Interfaz:** [React](https://react.dev/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Renderizado Gráfico:** [@hpcc-js/wasm](https://github.com/hpcc-systems/hpcc-js-wasm) (Graphviz WebAssembly)
- **Testing:** [Vitest](https://vitest.dev/)
