// src/app/page.tsx
"use client";

import { useState, useMemo, ChangeEvent, useEffect, useRef, DragEvent } from "react";
import { parseDFA } from "@/core/parser";
import { DFAEngine } from "@/core/engine";
import { DFA, SimulationState } from "@/types/dfa";
import { generateDotCode } from "@/utils/graphviz";
import DFADiagram from "@/components/DFADiagram";
import TransitionTable from "@/components/TransitionTable";
import StringsTable from "@/components/StringsTable";
import TopMenu from "@/components/TopMenu";

export default function Home() {
  const [dfa, setDfa] = useState<DFA | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'simulator' | 'editor'>('simulator');
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
  const [activeStringIndex, setActiveStringIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const [results, setResults] = useState<Record<number, 'accepted' | 'rejected' | 'error' | 'pending'>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const engine = useMemo(() => dfa ? new DFAEngine(dfa) : null, [dfa]);

  // --- LÓGICA DE MENÚS Y ARCHIVOS ---
  const triggerFileInput = () => fileInputRef.current?.click();

  const handleCreateNew = () => {
    const template = `Simbolos: 0,1\nEstados: Q0,Q1\nEstado inicial: Q0\nEstados de aceptación: Q1\nTransiciones:\nQ0,Q1\nQ1,Q0\nCadenas a analizar:\n1,0\n0,1,0`;
    setRawText(template);
    setViewMode('editor');
    setDfa(null);
    setSimulation(null);
    setError(null);
  };

  const handleSaveFile = () => {
    if (!rawText) return;
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'automata_definicion.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExit = () => {
    setDfa(null);
    setSimulation(null);
    setRawText("");
    setViewMode('simulator');
    setError(null);
  };

  const processContent = (content: string) => {
    try {
      const parsedDfa = parseDFA(content);
      setRawText(content);
      setDfa(parsedDfa);
      setError(null);
      setActiveStringIndex(0);
      setResults({});
      setIsPlaying(false);
      setViewMode('simulator');
      
      const newEngine = new DFAEngine(parsedDfa);
      setSimulation(newEngine.initialize(0));
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo.");
      setDfa(null);
      setSimulation(null);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
    e.target.value = '';
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processContent(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      readFile(file);
    } else {
      setError("Por favor, sube un archivo con extensión .txt válido.");
    }
  };

  const applyEditorChanges = () => processContent(rawText);

  // --- CONTROLES DE SIMULACIÓN ---
  const loadString = (index: number) => {
    if (!engine) return;
    setIsPlaying(false);
    setActiveStringIndex(index);
    setSimulation(engine.initialize(index));
  };

  const handleNext = () => {
    if (engine && simulation) {
      const nextState = engine.stepForward(simulation);
      setSimulation(nextState);
      updateResultsIfFinished(nextState);
    }
  };

  const handlePrev = () => {
    if (engine && simulation) {
      setSimulation(engine.stepBackward(simulation));
    }
  };

  const handleReset = () => {
    if (engine) {
      setIsPlaying(false);
      setSimulation(engine.initialize(activeStringIndex));
    }
  };

  const updateResultsIfFinished = (state: SimulationState) => {
    if (state.status === 'accepted' || state.status === 'rejected' || state.status === 'error') {
      setResults(prev => ({ ...prev, [activeStringIndex]: state.status as any }));
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying && simulation && engine) {
      if (simulation.status === 'accepted' || simulation.status === 'rejected' || simulation.status === 'error') {
        setIsPlaying(false);
        return;
      }
      intervalId = setInterval(() => {
        setSimulation(prevState => {
          if (!prevState) return prevState;
          const nextState = engine.stepForward(prevState);
          updateResultsIfFinished(nextState);
          return nextState;
        });
      }, speed);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, simulation, engine, speed, activeStringIndex]);

  const getStepExplanation = () => {
    if (!simulation || !dfa) return "Esperando inicialización del modelo.";
    const step = simulation.history[simulation.currentStepIndex];
    if (simulation.status === 'idle') return `Sistema inicializado. El cabezal está posicionado antes del primer símbolo. El estado actual es el nodo de origen [${dfa.initialState}].`;
    if (simulation.status === 'error') return `Excepción fatal detectada: ${simulation.errorMessage}`;
    if (step.transitionUsed) {
      const trans = step.transitionUsed;
      let exp = `Transición ejecutada: Estando en el estado [${trans.from}] y leyendo el símbolo '${trans.symbol}', el motor se desplaza al estado [${trans.to}].`;
      if (simulation.status === 'accepted') return `${exp} La cinta ha finalizado. El estado [${trans.to}] pertenece al conjunto de aceptación. Cadena ACEPTADA.`;
      if (simulation.status === 'rejected') return `${exp} La cinta ha finalizado. El estado [${trans.to}] NO pertenece al conjunto de aceptación. Cadena RECHAZADA.`;
      return exp;
    }
    if (simulation.currentString.length === 0) return `Se está evaluando la cadena vacía. Como el estado inicial [${dfa.initialState}] ${dfa.acceptStates.has(dfa.initialState) ? 'ES' : 'NO ES'} de aceptación, se evalúa en consecuencia.`;
    return "Evaluando matriz de transiciones...";
  };

  const dotCode = generateDotCode(simulation, dfa, isDarkMode);
  const isFinished = simulation?.status === 'accepted' || simulation?.status === 'rejected' || simulation?.status === 'error';

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
        <TopMenu 
          onOpenClick={triggerFileInput}
          onNewClick={handleCreateNew}
          onSaveClick={handleSaveFile}
          onExitClick={handleExit}
          onLoadExample={processContent}
          onShowAbout={() => setShowAbout(true)}
          onShowHelp={() => setShowHelp(true)}
          onShowGuide={() => setShowGuide(true)}
          hasActiveDFA={rawText.length > 0}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        
        <input type="file" accept=".txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

        {/* --- MODALES CONSISTENTES --- */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAbout(false)}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-300 dark:border-slate-700 transition-colors" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Acerca de</h2>
            <div className="space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong className="text-slate-900 dark:text-slate-100">Proyecto:</strong> Simulación de AFD</p>
              <p><strong className="text-slate-900 dark:text-slate-100">Universidad:</strong> Universidad Mariano Gálvez</p>
              <p><strong className="text-slate-900 dark:text-slate-100">Fecha:</strong> Octubre 2026</p>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Integrantes:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Angel Gustavo Sánchez Rodas 1890-24-13449</li>
                  <li>Edith Aldana Gonzales  1890-24-5214</li>
                  <li>Javier Alejandro Cruz Salvador 1890-24-14622</li>
                  <li>Adelyn Alessandra Orellana Quiroz 1890-24-6857</li>
                  <li>Joseph Raul Sánchez Portillo 1890-24-20912</li>
                  <li>Brandon Gustavo Casasola Orellana 1890-24-3551</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowAbout(false)} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow">Cerrar</button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl max-w-2xl w-full border border-slate-300 dark:border-slate-700 transition-colors" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Manual de Usuario</h2>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              <p><strong>1. Cargar un Autómata:</strong> Usa el menú <em>Archivo &gt; Abrir</em> o arrastra un archivo .txt al área principal para cargar tu modelo. También puedes ir a <em>Ejemplos</em> para probar uno predefinido.</p>
              <p><strong>2. Formato del Archivo:</strong> Tu .txt debe contener exactamente estas etiquetas: <code>Simbolos:</code>, <code>Estados:</code>, <code>Estado inicial:</code>, <code>Estados de aceptación:</code>, <code>Transiciones:</code> y <code>Cadenas a analizar:</code>.</p>
              <p><strong>3. Editor Integrado:</strong> Usa <em>Archivo &gt; Nuevo</em> para codificar las reglas directamente en la plataforma. Al terminar, pulsa "Guardar y Simular".</p>
              <p><strong>4. Simulación Interactiva:</strong> Utiliza los controles de la Cinta de Procesamiento para avanzar paso a paso, o ajusta el ciclo de reloj y presiona "Reproducir" para ejecución automática.</p>
              <p><strong>5. Exportación:</strong> Si creaste o editaste un autómata en pantalla, usa <em>Archivo &gt; Guardar</em> para descargar el archivo .txt a tu equipo.</p>
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow">Cerrar</button>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGuide(false)}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl max-w-3xl w-full border border-slate-300 dark:border-slate-700 transition-colors" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Guía Teórica: Autómatas Finitos Deterministas</h2>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              <p>Un <strong>Autómata Finito Determinista (AFD)</strong> es un modelo matemático computacional que procesa cadenas de símbolos. Formalmente se define como una quíntupla:</p>
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded text-center text-lg font-serif border dark:border-slate-700">
                M = (Q, Σ, δ, q0, F)
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Conjunto de Estados (Q):</strong> Es una colección finita de nodos. En nuestro simulador, se definen como <code>Q0, Q1, etc.</code></li>
                <li><strong>Alfabeto (Σ):</strong> Conjunto finito de símbolos válidos que la máquina puede leer. Ejemplo: <code>0, 1</code>.</li>
                <li><strong>Estado Inicial (q0):</strong> El estado único donde comienza el procesamiento.</li>
                <li><strong>Conjunto de Aceptación (F):</strong> Subconjunto de estados que determinan si la cadena es válida.</li>
                <li><strong>Función de Transición (δ):</strong> Es la regla central del motor. Define un estado de destino único para cada estado actual y símbolo.</li>
              </ul>
            </div>
            <button onClick={() => setShowGuide(false)} className="mt-8 w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-2 rounded shadow">Finalizar Lectura</button>
          </div>
        </div>
      )}

        {/* --- ÁREA PRINCIPAL --- */}
        <main className="flex-1 p-4 md:p-6 flex flex-col h-full">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-4 shadow-sm rounded">
              <p className="font-bold">Error de Validación</p>
              <p>{error}</p>
            </div>
          )}

          {viewMode === 'editor' && (
            <div className="flex-1 flex flex-col h-full w-full bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700 rounded transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Archivo de Entrada (Nuevo)</h2>
                <button onClick={applyEditorChanges} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm shadow">
                  Guardar y Simular
                </button>
              </div>
              <textarea
                className="flex-1 w-full p-4 font-mono text-sm border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-slate-50 dark:bg-slate-900 rounded text-slate-800 dark:text-slate-200 transition-colors"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>
          )}

          {/* ZONA DRAG & DROP CONSISTENTE */}
          {viewMode === 'simulator' && !dfa && (
            <div 
              className={`flex-1 flex flex-col items-center justify-center rounded-xl border-4 border-dashed transition-all duration-300 bg-white dark:bg-slate-900 ${
                isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-inner' : 'border-slate-300 dark:border-slate-700'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center text-slate-500 dark:text-slate-400 max-w-sm pointer-events-none">
                <div className="mb-4 text-4xl text-slate-300 dark:text-slate-600 font-bold">[ + ]</div>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Arrastra tu archivo aquí</p>
                <p className="text-sm mb-6">o utiliza el menú superior Archivo &gt; Abrir para seleccionar el documento local.</p>
              </div>
              <button onClick={triggerFileInput} className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-2 px-6 rounded shadow transition-colors">
                Explorar Archivos
              </button>
            </div>
          )}

          {/* ZONA DE SIMULACIÓN */}
          {viewMode === 'simulator' && dfa && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
              
              <div className="xl:col-span-8 flex flex-col gap-6">
                
                <section className="bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700 rounded flex-1 flex flex-col transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-slate-800 dark:text-slate-200">Diagrama del AFD (Dinámico)</h2>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-inner border ${
                      simulation?.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                      simulation?.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                    }`}>
                      {simulation?.status === 'accepted' && 'CADENA ACEPTADA'}
                      {simulation?.status === 'rejected' && 'CADENA RECHAZADA'}
                      {(simulation?.status === 'idle' || simulation?.status === 'running') && 'COMPUTANDO'}
                    </div>
                  </div>
                  {/* Contenedor del Graphviz */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[300px] rounded overflow-hidden">
                    <DFADiagram dotCode={dotCode} />
                  </div>
                </section>

                {/* PANEL ESTÉTICO (AHORA ADAPTABLE AL TEMA PERO SIEMPRE DESTACADO) */}
                <section className="bg-slate-100 dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 transition-colors">
                  <div className="mb-6">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider">Cinta de Procesamiento</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 items-center">
                      <div className="h-8 w-8 flex-shrink-0 bg-slate-300 dark:bg-slate-700 rounded-l-full"></div>
                      
                      {simulation?.currentString.map((sym, idx) => {
                        const isCurrent = idx === (simulation.history[simulation.currentStepIndex]?.stringIndex);
                        const isPast = idx < (simulation.history[simulation.currentStepIndex]?.stringIndex);
                        
                        return (
                          <div key={idx} className={`h-12 min-w-[3rem] flex items-center justify-center text-xl font-mono border-2 transition-all duration-300 ${
                            isCurrent ? 'bg-yellow-400 border-yellow-300 text-slate-900 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.4)] z-10 font-black' : 
                            isPast ? 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-400 dark:text-slate-400' : 
                            'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                          }`}>
                            {sym}
                          </div>
                        );
                      })}
                      
                      <div className="h-8 w-8 flex-shrink-0 bg-slate-300 dark:bg-slate-700 rounded-r-full"></div>
                    </div>
                  </div>

                  <div className="mb-6 bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-300 dark:border-slate-600 shadow-inner">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">Análisis de Transición Matemática</p>
                    <p className="text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed border-l-2 border-blue-500 pl-3">
                      {getStepExplanation()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-200 dark:bg-slate-900 p-4 rounded-lg border border-slate-300 dark:border-slate-700">
                    <div className="flex gap-2">
                      <button onClick={handleReset} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded font-bold transition-colors border border-slate-300 dark:border-transparent">
                        Reiniciar
                      </button>
                      <button onClick={handlePrev} disabled={simulation?.currentStepIndex === 0 || isPlaying} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded font-bold disabled:opacity-50 transition-colors border border-slate-300 dark:border-transparent">
                        Anterior
                      </button>
                      <button onClick={handleNext} disabled={isFinished || isPlaying} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded font-bold disabled:opacity-50 transition-colors border border-slate-300 dark:border-transparent">
                        Siguiente
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400 uppercase">Ciclo de Reloj</span>
                        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 text-sm rounded focus:ring-blue-500 focus:border-blue-500 p-1.5">
                          <option value={2000}>Lento (2s)</option>
                          <option value={1000}>Normal (1s)</option>
                          <option value={400}>Rápido (0.4s)</option>
                        </select>
                      </div>
                      
                      <button onClick={() => setIsPlaying(!isPlaying)} disabled={isFinished} className={`px-8 py-3 rounded font-black uppercase tracking-wider transition-all shadow text-white ${
                          isPlaying ? 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                        } disabled:opacity-50 disabled:shadow-none`}>
                        {isPlaying ? 'Pausar' : 'Reproducir'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <div className="xl:col-span-4 flex flex-col gap-6">
                <StringsTable dfa={dfa} activeStringIndex={activeStringIndex} results={results} onSelectString={loadString} />
                <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex-1 rounded overflow-hidden flex flex-col transition-colors">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 border-b dark:border-slate-700 pb-2">Tabla de Transiciones (Dinámica)</h3>
                  <div className="flex-1 overflow-auto">
                     <TransitionTable dfa={dfa} simulation={simulation} />
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}