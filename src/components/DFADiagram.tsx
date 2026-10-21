// src/components/DFADiagram.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Graphviz } from '@hpcc-js/wasm';

type GraphvizInstance = Awaited<ReturnType<typeof Graphviz.load>>;

// Instancia singleton precalentada en memoria para renderizado instantáneo
let graphvizInstance: GraphvizInstance | null = null;
let graphvizPromise: Promise<GraphvizInstance> | null = null;

function getGraphviz(): Promise<GraphvizInstance> {
  if (graphvizInstance) return Promise.resolve(graphvizInstance);
  if (!graphvizPromise) {
    graphvizPromise = Graphviz.load().then((instance) => {
      graphvizInstance = instance;
      return instance;
    });
  }
  return graphvizPromise;
}

// Iniciar pre-carga en cliente si estamos en navegador
if (typeof window !== 'undefined') {
  getGraphviz().catch(() => {});
}

interface DFADiagramProps {
  dotCode: string;
  className?: string;
  heightClass?: string;
}

export default function DFADiagram({ dotCode, className = '', heightClass = 'h-[360px]' }: DFADiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDotRef = useRef<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const scaleRef = useRef<number>(scale);
  scaleRef.current = scale;

  useEffect(() => {
    let isMounted = true;

    const applySvg = (svg: string) => {
      if (!isMounted || !containerRef.current) return;
      containerRef.current.innerHTML = svg;
      
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '100%';
        svgElement.style.display = 'block';
        svgElement.style.margin = 'auto';
        svgElement.style.transform = `scale(${scaleRef.current})`;
        svgElement.style.transformOrigin = 'center center';
      }
      setError(null);
    };

    if (!dotCode) {
      if (containerRef.current) containerRef.current.innerHTML = '';
      lastDotRef.current = '';
      return;
    }

    if (lastDotRef.current === dotCode && containerRef.current?.innerHTML) {
      return;
    }
    lastDotRef.current = dotCode;

    // Ejecución síncrona inmediata si el módulo Wasm ya está en memoria
    if (graphvizInstance) {
      try {
        const svg = graphvizInstance.layout(dotCode, 'svg', 'dot');
        applySvg(svg);
        return;
      } catch {
        if (isMounted) setError("Error al generar el diagrama.");
        return;
      }
    }

    // Inicialización asíncrona si es la primera carga
    getGraphviz()
      .then((instance) => {
        if (!isMounted) return;
        try {
          const svg = instance.layout(dotCode, 'svg', 'dot');
          applySvg(svg);
        } catch {
          if (isMounted) setError("Error al generar el diagrama.");
        }
      })
      .catch(() => {
        if (isMounted) setError("Error al inicializar el motor de diagramas.");
      });

    return () => {
      isMounted = false;
    };
  }, [dotCode]);

  useEffect(() => {
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${scale})`;
        svgElement.style.transformOrigin = 'center center';
      }
    }
  }, [scale]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className={`w-full ${heightClass} ${className} rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 mac-panel-vibrancy flex items-center justify-center p-4 overflow-hidden relative group transition-all duration-150`}>
      {/* Patrón de cuadrícula tipo lienzo macOS */}
      <div 
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '18px 18px'
        }}
      />

      {error ? (
        <span role="alert" className="text-red-500 font-semibold text-xs z-10">{error}</span>
      ) : (
        <div 
          id="dfa-graphviz-canvas"
          role="img"
          aria-label="Grafo de estados y transiciones generado mediante Graphviz"
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center z-0" 
        />
      )}

      {/* Barra de herramientas flotante estilo macOS en la esquina inferior */}
      <div 
        role="toolbar"
        aria-label="Controles de zoom del diagrama"
        className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 mac-panel-vibrancy border border-black/10 dark:border-white/10 shadow-sm z-20 text-xs text-slate-700 dark:text-slate-300"
      >
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
          title="Alejar diagrama"
          aria-label="Alejar diagrama"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none" aria-hidden="true" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          id="btn-zoom-reset"
          onClick={handleResetZoom}
          className="px-1.5 py-0.5 text-[11px] font-mono hover:bg-black/10 dark:hover:bg-white/15 rounded transition-colors"
          title="Restablecer escala al 100%"
          aria-label="Restablecer escala al 100%"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
          title="Acercar diagrama"
          aria-label="Acercar diagrama"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none" aria-hidden="true" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M12 5v14m-7-7h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
