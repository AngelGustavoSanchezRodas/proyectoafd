// src/components/DFADiagram.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Graphviz } from '@hpcc-js/wasm';
import { downloadSvgFile, downloadPngFile, getDiagramFileName } from '../utils/exportDiagram';

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
  fileName?: string;
  isDarkMode?: boolean;
}

export default function DFADiagram({
  dotCode,
  className = '',
  heightClass = 'h-[360px]',
  fileName = 'diagrama_automata',
  isDarkMode = false
}: DFADiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastDotRef = useRef<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!dotCode) {
      if (containerRef.current) containerRef.current.innerHTML = '';
      lastDotRef.current = '';
      return;
    }

    if (lastDotRef.current === dotCode && containerRef.current?.innerHTML) {
      return;
    }

    getGraphviz()
      .then((instance) => {
        if (!isMounted) return;
        try {
          const svg = instance.layout(dotCode, 'svg', 'dot');
          if (!isMounted) return;
          lastDotRef.current = dotCode;
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
              svgElement.style.width = '100%';
              svgElement.style.height = '100%';
              svgElement.style.maxWidth = '100%';
              svgElement.style.maxHeight = '100%';
              svgElement.style.display = 'block';
              svgElement.style.margin = 'auto';
            }
          }
          setError(null);
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
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleDownloadSvg = () => {
    setIsMenuOpen(false);
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;
    const targetName = getDiagramFileName(fileName, 'svg');
    downloadSvgFile(svgElement, targetName, { isDarkMode });
  };

  const handleDownloadPng = async () => {
    setIsMenuOpen(false);
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;
    try {
      setIsExporting(true);
      const targetName = getDiagramFileName(fileName, 'png');
      await downloadPngFile(svgElement, targetName, { isDarkMode, scale: 2 });
    } catch {
      setError("No fue posible generar la imagen PNG.");
    } finally {
      setIsExporting(false);
    }
  };

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
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          className="w-full h-full flex items-center justify-center z-0 transition-transform duration-100" 
        />
      )}

      {/* Barra de herramientas flotante estilo macOS en la esquina inferior */}
      <div 
        role="toolbar"
        aria-label="Controles de zoom y exportación del diagrama"
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

        {/* Separador de sección */}
        <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" aria-hidden="true" />

        {/* Menú de Descarga */}
        <div className="relative" ref={menuRef}>
          <button
            id="btn-download-diagram-menu"
            onClick={() => setIsMenuOpen(prev => !prev)}
            disabled={!dotCode || Boolean(error) || isExporting}
            className={`p-1 rounded transition-colors flex items-center space-x-1 ${
              isMenuOpen
                ? 'bg-blue-600 text-white'
                : 'hover:bg-black/10 dark:hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent'
            }`}
            title="Descargar diagrama dibujado"
            aria-label="Descargar diagrama dibujado en formato SVG o PNG"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none" aria-hidden="true" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="text-[11px] font-medium hidden sm:inline">Descargar</span>
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="Opciones de descarga de diagrama"
              className="absolute bottom-full right-0 mb-2 w-56 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-xl py-1.5 text-xs z-50 select-none"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Exportar Diagrama
              </div>
              <button
                id="item-download-svg"
                role="menuitem"
                onClick={handleDownloadSvg}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-white">
                    Descargar SVG
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-white/80">
                    Vectorial escalable (LaTeX / PDF)
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-70 group-hover:opacity-100">.svg</span>
              </button>
              <button
                id="item-download-png"
                role="menuitem"
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group disabled:opacity-50"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-white">
                    {isExporting ? 'Generando PNG...' : 'Descargar PNG'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-white/80">
                    Imagen de alta definición (2x)
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-70 group-hover:opacity-100">.png</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
