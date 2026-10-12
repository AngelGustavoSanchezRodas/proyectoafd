// src/components/DFADiagram.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Graphviz } from '@hpcc-js/wasm';

interface DFADiagramProps {
  dotCode: string;
}

export default function DFADiagram({ dotCode }: DFADiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderGraph() {
      if (!dotCode || !containerRef.current) return;
      
      try {
        const graphviz = await Graphviz.load();
        // Generar SVG a partir del código DOT
        const svg = graphviz.layout(dotCode, 'svg', 'dot');
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          // Ajustar el SVG para que sea responsivo
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            svgElement.style.maxWidth = '100%';
          }
          setError(null);
        }
      } catch (err) {
        console.error("Error renderizando Graphviz:", err);
        if (isMounted) setError("Error al generar el diagrama.");
      }
    }

    renderGraph();

    return () => {
      isMounted = false;
    };
  }, [dotCode]);

  return (
    <div className="w-full h-96 border rounded-lg bg-white shadow-inner flex items-center justify-center p-4 overflow-hidden relative">
      {error ? (
        <span className="text-red-500 font-semibold">{error}</span>
      ) : (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
      )}
    </div>
  );
}