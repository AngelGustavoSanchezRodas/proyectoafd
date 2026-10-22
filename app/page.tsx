// src/app/page.tsx
"use client";

import { useState, useMemo, ChangeEvent, useEffect, useRef, DragEvent } from "react";
import { parseDFA, parseDFATolerant } from "@/core/parser";
import { autoAlignDFAText } from "@/core/formatter";
import { DFAEngine } from "@/core/engine";
import { DFA, SimulationState } from "@/types/dfa";
import { generateDotCode } from "@/utils/graphviz";
import { getStepExplanation } from "@/utils/explanation";
import { dfaExamples } from "@/utils/examples";
import DFADiagram from "@/components/DFADiagram";
import TransitionTable from "@/components/TransitionTable";
import StringsTable from "@/components/StringsTable";
import TopMenu from "@/components/TopMenu";
import TapeViewer from "@/components/TapeViewer";
import AboutModal from "@/components/AboutModal";
import HelpModal from "@/components/HelpModal";
import GuideModal from "@/components/GuideModal";

export default function Home() {
  const [dfa, setDfa] = useState<DFA | null>(null);
  const [liveDfa, setLiveDfa] = useState<DFA | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveWarnings, setLiveWarnings] = useState<string[]>([]);
  const [rawText, setRawText] = useState<string>("");
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("automata_definicion.txt");
  
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

  // Sincronización y validación reactiva en vivo del texto del autómata
  useEffect(() => {
    if (!rawText.trim()) {
      setLiveDfa(null);
      setLiveError(null);
      setLiveWarnings([]);
      return;
    }

    const timer = setTimeout(() => {
      const result = parseDFATolerant(rawText);
      // Siempre actualizamos liveDfa para que el diagrama muestre inmediatamente estados, aceptación y transiciones válidas
      if (result.dfa.states.length > 0) {
        setLiveDfa(result.dfa);
      }
      setLiveError(result.error);
      setLiveWarnings(result.warnings);

      if (result.isValidForSimulation) {
        setDfa(result.dfa);
        setError(null);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [rawText]);

  // Sincronización al alternar a la vista de simulación
  useEffect(() => {
    if (viewMode === 'simulator' && dfa) {
      if (!simulation || simulation.dfa !== dfa) {
        const newEngine = new DFAEngine(dfa);
        setSimulation(newEngine.initialize(0));
        setActiveStringIndex(0);
        setResults({});
        setIsPlaying(false);
      }
    }
  }, [viewMode, dfa]);

  // --- GESTIÓN DE ARCHIVOS Y MODELO ---
  const triggerFileInput = () => fileInputRef.current?.click();

  const handleCreateNew = () => {
    const template = `Simbolos: 0,1\nEstados: Q0,Q1\nEstado inicial: Q0\nEstados de aceptación: Q1\nTransiciones:\nQ0,Q1\nQ1,Q0\nCadenas a analizar:\n1,0\n0,1,0`;
    setRawText(template);
    setFileName("nuevo_automata.txt");
    setViewMode('editor');
    setError(null);
    setLiveError(null);
  };

  const handleSaveFile = () => {
    if (!rawText) return;
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'automata_definicion.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExit = () => {
    setDfa(null);
    setLiveDfa(null);
    setSimulation(null);
    setRawText("");
    setFileName("automata_definicion.txt");
    setViewMode('simulator');
    setError(null);
    setLiveError(null);
    setIsPlaying(false);
  };

  const processContent = (content: string, name?: string) => {
    try {
      const parsedDfa = parseDFA(content);
      setRawText(content);
      if (name) setFileName(name);
      setDfa(parsedDfa);
      setLiveDfa(parsedDfa);
      setError(null);
      setLiveError(null);
      setActiveStringIndex(0);
      setResults({});
      setIsPlaying(false);
      setViewMode('simulator');
      
      const newEngine = new DFAEngine(parsedDfa);
      setSimulation(newEngine.initialize(0));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar el archivo.";
      setError(msg);
      setDfa(null);
      setLiveDfa(null);
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
      processContent(content, file.name);
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
      setError("Por favor, selecciona un archivo con extensión .txt válido.");
    }
  };

  const handleAutoAlignTransitions = () => {
    setRawText(autoAlignDFAText(rawText));
  };

  const handleApplyAndSimulate = () => {
    const result = parseDFATolerant(rawText);
    if (!result.isValidForSimulation) {
      setError(`No es posible simular debido a un error en la definición formal: ${result.error || 'Definición incompleta'}`);
      return;
    }
    setDfa(result.dfa);
    setLiveDfa(result.dfa);
    setActiveStringIndex(0);
    setResults({});
    setIsPlaying(false);
    setError(null);
    const newEngine = new DFAEngine(result.dfa);
    setSimulation(newEngine.initialize(0));
    setViewMode('simulator');
  };

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
      setResults(prev => ({ ...prev, [activeStringIndex]: state.status as 'accepted' | 'rejected' | 'error' | 'pending' }));
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



  const dotCode = useMemo(() => {
    return generateDotCode(simulation, dfa, isDarkMode);
  }, [simulation, dfa, isDarkMode]);

  const liveDotCode = useMemo(() => {
    const currentDfa = liveDfa || dfa;
    if (!currentDfa) return '';
    return generateDotCode(null, currentDfa, isDarkMode);
  }, [liveDfa, dfa, isDarkMode]);

  const isFinished = simulation?.status === 'accepted' || simulation?.status === 'rejected' || simulation?.status === 'error';

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        
        {/* Barra Superior con Estética macOS */}
        <TopMenu 
          onOpenClick={triggerFileInput}
          onNewClick={handleCreateNew}
          onSaveClick={handleSaveFile}
          onExitClick={handleExit}
          onLoadExample={(content, name) => processContent(content, name)}
          onShowAbout={() => setShowAbout(true)}
          onShowHelp={() => setShowHelp(true)}
          onShowGuide={() => setShowGuide(true)}
          hasActiveDFA={rawText.length > 0}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <input 
          id="file-input-upload"
          type="file" 
          accept=".txt" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          aria-label="Cargar archivo de definición formal en formato texto"
        />

        {/* Contenido Principal con Accesibilidad Semántica y Landmark */}
        <main 
          id="main-content"
          role="main"
          tabIndex={-1}
          className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col space-y-6 focus:outline-none"
        >
          {/* Título Principal Semántico Oculto para Lectores de Pantalla y SEO */}
          <h1 className="sr-only">
            Simulador de Autómatas Finitos Deterministas (AFD)
          </h1>
          
          {/* Alerta de Error con Estética macOS */}
          {error && (
            <div 
              id="alert-system-notification"
              role="alert" 
              aria-live="assertive"
              className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 flex items-start space-x-3 text-xs shadow-xs"
            >
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[11px]" aria-hidden="true">
                !
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Aviso del Sistema</p>
                <p className="opacity-90">{error}</p>
              </div>
              <button 
                id="btn-dismiss-error"
                onClick={() => setError(null)}
                aria-label="Cerrar aviso de error"
                className="text-rose-600 hover:text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 text-base"
              >
                ×
              </button>
            </div>
          )}

          {/* Barra de Información del Modelo Cargado */}
          {dfa && viewMode === 'simulator' && (
            <section 
              id="section-active-model-bar"
              aria-label="Información del autómata activo"
              className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400" aria-hidden="true">
                  <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <span>{fileName}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                      Activo
                    </span>
                  </h2>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    <span>Alfabeto: &#123;{dfa.symbols.join(', ')}&#125;</span>
                    <span>•</span>
                    <span>Estados: &#123;{dfa.states.join(', ')}&#125;</span>
                    <span>•</span>
                    <span>Inicial: {dfa.initialState}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-edit-definition"
                  onClick={() => setViewMode('editor')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Editar Definición
                </button>
                <button
                  id="btn-download-txt-file"
                  onClick={handleSaveFile}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Descargar .txt
                </button>
                <button
                  id="btn-close-active-dfa"
                  onClick={handleExit}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </section>
          )}

          {/* VISTA DEL EDITOR: STUDIO EN VIVO (EDITOR Y DIAGRAMA EN TIEMPO REAL) */}
          {viewMode === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
              
              {/* Columna Izquierda: Editor de Código Formal */}
              <section 
                id="section-code-editor"
                aria-label="Editor formal de autómata"
                className="lg:col-span-6 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden"
              >
                
                {/* Cabecera del Editor */}
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between select-none">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true"></span>
                    <h2 className="font-semibold text-xs tracking-tight text-slate-900 dark:text-slate-100">
                      Editor Formal (.txt)
                    </h2>
                    
                    {/* Badge de Estado de Sintaxis */}
                    {rawText.trim().length === 0 ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                        Vacío
                      </span>
                    ) : liveError ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                        <span>Editando</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                        <span>Sintaxis Válida</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {liveError && (
                      <button
                        id="btn-auto-align-editor"
                        onClick={handleAutoAlignTransitions}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 transition-colors"
                        title="Ajustar filas de transición al número de símbolos del alfabeto"
                      >
                        Ajustar al Alfabeto
                      </button>
                    )}
                    <button 
                      id="btn-template-editor"
                      onClick={handleCreateNew}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Insertar plantilla con formato estándar"
                    >
                      Plantilla
                    </button>
                    <button 
                      id="btn-apply-and-simulate"
                      onClick={handleApplyAndSimulate}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all flex items-center space-x-1.5"
                    >
                      <span>Simular</span>
                      <svg className="w-3.5 h-3.5 stroke-current fill-none" aria-hidden="true" viewBox="0 0 24 24" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Área de Texto Monospaced */}
                <div className="flex-1 relative flex flex-col">
                  <textarea
                    id="dfa-code-editor-textarea"
                    aria-label="Área de edición de código de autómata formal"
                    className="flex-1 w-full p-4 font-mono text-xs leading-relaxed border-none focus:outline-none focus:ring-0 resize-none bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 min-h-[260px] lg:min-h-[340px]"
                    placeholder="Escribe o pega aquí la definición formal del autómata..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    spellCheck={false}
                  />

                  {/* Guía informativa de matriz delta */}
                  {liveDfa && liveDfa.symbols.length > 0 && (
                    <div className="px-4 py-1.5 bg-slate-100/50 dark:bg-slate-800/40 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-1 select-none">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-sans font-medium text-slate-600 dark:text-slate-300">Regla δ:</span>
                        <span>{liveDfa.symbols.length} destinos por fila (para {liveDfa.symbols.map(s => `'${s}'`).join(', ')})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{liveDfa.states.length} filas esperadas (Q)</span>
                      </div>
                    </div>
                  )}

                  {/* Aviso no bloqueante mientras escribe si la sintaxis está incompleta */}
                  {liveError && rawText.trim().length > 0 && (
                    <div 
                      id="editor-syntax-notice"
                      role="status"
                      aria-live="polite"
                      className="m-3 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs flex items-start space-x-2.5"
                    >
                      <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5" aria-hidden="true">
                        !
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[11px] text-amber-900 dark:text-amber-100 mb-0.5">Aviso de Definición Formal</p>
                        <p className="font-mono text-[11px] leading-relaxed opacity-95">{liveError}</p>
                      </div>
                      <button
                        id="btn-auto-align-inline"
                        onClick={handleAutoAlignTransitions}
                        className="px-2 py-1 text-[10px] font-sans font-medium rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 border border-amber-500/30 transition-colors flex-shrink-0"
                      >
                        Auto-Ajustar
                      </button>
                    </div>
                  )}
                </div>

                {/* Barra Inferior de Métricas */}
                <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-800/40 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 select-none">
                  <div className="flex items-center space-x-3">
                    <span>Líneas: {rawText.split('\n').length}</span>
                    <span>•</span>
                    <span>Caracteres: {rawText.length}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>Estados: {(liveDfa || dfa)?.states.length ?? 0}</span>
                    <span>•</span>
                    <span>Símbolos: {(liveDfa || dfa)?.symbols.length ?? 0}</span>
                  </div>
                </div>

              </section>

              {/* Columna Derecha: Diagrama en Vivo */}
              <section 
                id="section-live-diagram"
                aria-label="Visualización de grafo en tiempo real"
                className="lg:col-span-6 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden"
              >
                
                {/* Cabecera del Diagrama en Vivo */}
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between select-none">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
                    <h2 className="font-semibold text-xs tracking-tight text-slate-900 dark:text-slate-100">
                      Diagrama en Vivo
                    </h2>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                      Tiempo Real
                    </span>
                  </div>

                  {liveDfa && (
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Inicial: {liveDfa.initialState}</span>
                      <span>•</span>
                      <span>Aceptación: &#123;{Array.from(liveDfa.acceptStates).join(', ')}&#125;</span>
                    </div>
                  )}
                </div>

                {/* Contenedor del Diagrama */}
                <div className="flex-1 p-4 flex flex-col">
                  {liveDotCode ? (
                    <DFADiagram 
                      dotCode={liveDotCode} 
                      heightClass="h-[360px] lg:h-[460px]" 
                    />
                  ) : (
                    <div className="flex-1 w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 min-h-[360px]">
                      <div className="w-12 h-12 mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400" aria-hidden="true">
                        <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Diagrama no disponible
                      </p>
                      <p className="text-[11px] max-w-xs leading-relaxed">
                        Escribe la definición formal a la izquierda o carga una plantilla para visualizar el autómata en vivo.
                      </p>
                    </div>
                  )}
                </div>

              </section>

            </div>
          )}

          {/* VISTA SIMULADOR: PANTALLA INICIAL (EMPTY STATE CON ESTÉTICA MACOS) */}
          {viewMode === 'simulator' && !dfa && (
            <section 
              id="section-empty-loader"
              aria-label="Cargar definición de autómata"
              className="flex-1 flex flex-col items-center justify-center py-12 px-4"
            >
              
              {/* Tarjeta Central de Carga */}
              <div 
                id="dropzone-automata-upload"
                className={`w-full max-w-2xl rounded-3xl p-10 border-2 transition-all duration-200 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs flex flex-col items-center text-center ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 scale-[0.99]' 
                    : 'border-dashed border-slate-300 dark:border-slate-700'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 mb-5 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400" aria-hidden="true">
                  <svg className="w-8 h-8 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
                  Cargar Definición de Autómata
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                  Arrastra un archivo de texto con extensión .txt a este panel o selecciónalo manualmente desde tus carpetas locales.
                </p>

                <div className="flex items-center space-x-3 mb-8">
                  <button 
                    id="btn-browse-file"
                    onClick={triggerFileInput}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-xs transition-all focus:ring-2 focus:ring-blue-400"
                  >
                    Explorar Archivo...
                  </button>
                  <button 
                    id="btn-create-new-dfa"
                    onClick={handleCreateNew}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs py-2.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Crear Nuevo
                  </button>
                </div>

                {/* Galería de Ejemplos Rápidos */}
                <div className="w-full pt-6 border-t border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                    O selecciona un modelo preconfigurado:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {dfaExamples.map((ex) => (
                      <button
                        key={ex.id}
                        id={`btn-example-item-${ex.id}`}
                        onClick={() => processContent(ex.content, `${ex.name.toLowerCase().replace(/\s+/g, '_')}.txt`)}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/50 dark:hover:border-blue-500/50 text-left transition-all group"
                      >
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                          {ex.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                          {ex.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </section>
          )}

          {/* VISTA SIMULADOR: PANELES ACTIVOS CON EL AUTÓMATA */}
          {viewMode === 'simulator' && dfa && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Columna Izquierda: Diagrama y Cinta de Simulación (8 cols) */}
              <div className="xl:col-span-8 flex flex-col space-y-6">
                
                {/* Tarjeta del Diagrama de Estados */}
                <section 
                  id="section-state-diagram-card"
                  aria-label="Visualización del grafo de estados"
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true"></span>
                      <h2 className="font-semibold text-xs tracking-tight text-slate-900 dark:text-slate-100">
                        Grafo de Estados (Graphviz Wasm)
                      </h2>
                    </div>
                    
                    {/* Indicador de Estado del Autómata */}
                    <div 
                      id="badge-simulation-status"
                      role="status"
                      aria-live="polite"
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 border shadow-2xs ${
                        simulation?.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                        simulation?.status === 'rejected' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' :
                        'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        simulation?.status === 'accepted' ? 'bg-emerald-500' :
                        simulation?.status === 'rejected' ? 'bg-rose-500' :
                        'bg-blue-500 animate-pulse'
                      }`} aria-hidden="true"></span>
                      <span>
                        {simulation?.status === 'accepted' && 'Cadena Aceptada'}
                        {simulation?.status === 'rejected' && 'Cadena Rechazada'}
                        {(simulation?.status === 'idle' || simulation?.status === 'running') && 'Computando'}
                      </span>
                    </div>
                  </div>

                  <DFADiagram dotCode={dotCode} />
                </section>

                {/* Tarjeta de la Cinta de Procesamiento y Controles */}
                <section 
                  id="section-simulation-controls"
                  aria-label="Cinta y controles de simulación"
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 flex flex-col space-y-5"
                >
                  
                  {/* Vista de la Cinta Desacoplada */}
                  <TapeViewer simulation={simulation} />

                  {/* Inspector de Transición Matemática */}
                  <div 
                    id="box-step-explanation"
                    role="region"
                    aria-label="Explicación del paso matemático actual"
                    aria-live="polite"
                    className="p-4 bg-slate-100/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800/70 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start space-x-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" aria-hidden="true"></span>
                    <p>{getStepExplanation(simulation, dfa)}</p>
                  </div>

                  {/* Barra de Controles de Ejecución */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                    
                    {/* Botones de Paso a Paso */}
                    <div className="flex items-center space-x-2" role="group" aria-label="Navegación en el tiempo de la simulación">
                      <button
                        id="btn-sim-reset"
                        onClick={handleReset}
                        aria-label="Reiniciar simulación"
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Reiniciar
                      </button>
                      <button
                        id="btn-sim-prev"
                        onClick={handlePrev}
                        disabled={simulation?.currentStepIndex === 0 || isPlaying}
                        aria-label="Paso anterior (retroceder)"
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <button
                        id="btn-sim-next"
                        onClick={handleNext}
                        disabled={isFinished || isPlaying}
                        aria-label="Paso siguiente (avanzar)"
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40"
                      >
                        Siguiente
                      </button>
                    </div>

                    {/* Selector de Velocidad y Reproducción */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                        <label htmlFor="select-sim-speed">Ciclo:</label>
                        <select
                          id="select-sim-speed"
                          value={speed}
                          onChange={(e) => setSpeed(Number(e.target.value))}
                          aria-label="Velocidad del ciclo de reproducción"
                          className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={2000}>Lento (2s)</option>
                          <option value={1000}>Normal (1s)</option>
                          <option value={400}>Rápido (0.4s)</option>
                        </select>
                      </div>

                      <button
                        id="btn-sim-play-pause"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={isFinished}
                        aria-label={isPlaying ? 'Pausar simulación automática' : 'Reproducir simulación automáticamente'}
                        className={`px-6 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-40 ${
                          isPlaying
                            ? 'bg-amber-600 hover:bg-amber-500'
                            : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                      >
                        {isPlaying ? 'Pausar' : 'Reproducir'}
                      </button>
                    </div>
                  </div>

                </section>
              </div>

              {/* Columna Derecha: Tablas de Cadenas y Transiciones (4 cols) */}
              <div className="xl:col-span-4 flex flex-col space-y-6">
                <StringsTable 
                  dfa={dfa} 
                  activeStringIndex={activeStringIndex} 
                  results={results} 
                  onSelectString={loadString} 
                />
                
                <section 
                  id="section-transition-table-card"
                  aria-label="Matriz de transiciones delta"
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 flex flex-col"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true"></span>
                    <h2 className="font-semibold text-xs tracking-tight text-slate-900 dark:text-slate-100">
                      Matriz de Transiciones &delta;
                    </h2>
                  </div>
                  <TransitionTable dfa={dfa} simulation={simulation} />
                </section>
              </div>

            </div>
          )}

        </main>

        {/* --- MODALES CON ESTÉTICA MACOS (DIALOG SHEET) DESACOPLADOS --- */}
        <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      </div>
    </div>
  );
}