// src/app/page.tsx
"use client";

import { useState, useMemo, ChangeEvent, useEffect, useRef } from "react";
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
  
  // Vistas y Modales
  const [viewMode, setViewMode] = useState<'simulator' | 'editor'>('simulator');
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [activeStringIndex, setActiveStringIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const [results, setResults] = useState<Record<number, 'accepted' | 'rejected' | 'error' | 'pending'>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const engine = useMemo(() => dfa ? new DFAEngine(dfa) : null, [dfa]);

  // --- LÓGICA DE MENÚS ---

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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

  // --- PROCESAMIENTO DE TEXTO ---

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
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processContent(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const applyEditorChanges = () => {
    processContent(rawText);
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

  const dotCode = generateDotCode(simulation, dfa);
  const isFinished = simulation?.status === 'accepted' || simulation?.status === 'rejected' || simulation?.status === 'error';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Barra de Menú Estilo Escritorio */}
      <TopMenu 
        onOpenClick={triggerFileInput}
        onNewClick={handleCreateNew}
        onSaveClick={handleSaveFile}
        onExitClick={handleExit}
        onLoadExample={processContent}
        onShowAbout={() => setShowAbout(true)}
        onShowHelp={() => setShowHelp(true)}
        hasActiveDFA={rawText.length > 0}
      />
      
      <input type="file" accept=".txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      {/* Modales */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-300">
            <h2 className="text-2xl font-black text-slate-800 mb-4 border-b pb-2">Acerca de</h2>
            <div className="space-y-2 text-slate-700">
              <p><strong className="text-slate-900">Proyecto:</strong> Plataforma Web Interactiva para AFD</p>
              <p><strong className="text-slate-900">Universidad:</strong> Universidad Mariano Gálvez</p>
              <p><strong className="text-slate-900">Campus:</strong> Guastatoya</p>
              <p><strong className="text-slate-900">Fecha:</strong> Octubre 2026</p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Integrantes del Grupo:</p>
                <ul className="list-disc pl-5">
                  <li>Angel Gustavo Sánchez Rodas</li>
                  <li className="text-slate-400 italic">Nombre Compañero 2</li>
                  <li className="text-slate-400 italic">Nombre Compañero 3</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowAbout(false)} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">Cerrar</button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full border border-slate-300 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-4 border-b pb-2">Manual de Usuario</h2>
            <div className="space-y-4 text-slate-700 text-sm">
              <p><strong>1. Cargar un Autómata:</strong> Usa el menú <em>Archivo &gt; Abrir</em> para seleccionar un archivo .txt con la estructura requerida, o ve a <em>Ejemplos</em> para probar uno predefinido.</p>
              <p><strong>2. Formato del Archivo:</strong> Debe contener las etiquetas exactas: <code>Simbolos:</code>, <code>Estados:</code>, <code>Estado inicial:</code>, <code>Estados de aceptación:</code>, <code>Transiciones:</code> y <code>Cadenas a analizar:</code>.</p>
              <p><strong>3. Editor Integrado:</strong> Usa <em>Archivo &gt; Nuevo</em> para escribir las reglas directamente en la plataforma. Luego pulsa "Validar y Simular".</p>
              <p><strong>4. Simulación:</strong> Utiliza los controles de la Cinta de Lectura para avanzar paso a paso, o ajusta la velocidad y presiona "Reproducir" para ejecución automática.</p>
              <p><strong>5. Guardar:</strong> Si creaste o editaste un autómata en pantalla, usa <em>Archivo &gt; Guardar</em> para descargar el archivo .txt a tu equipo.</p>
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">Entendido</button>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 flex flex-col">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 shadow-sm rounded">
            <p className="font-bold">Error de Validación</p>
            <p>{error}</p>
          </div>
        )}

        {/* VISTA DE EDITOR */}
        {viewMode === 'editor' && (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Editor de Definición (AFD)</h2>
              <button onClick={applyEditorChanges} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow">
                Validar y Simular
              </button>
            </div>
            <textarea
              className="flex-1 w-full p-4 font-mono text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-inner"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Escribe la definición del autómata aquí..."
            />
          </div>
        )}

        {/* VISTA DE SIMULADOR (Si no hay DFA y no estamos en el editor) */}
        {viewMode === 'simulator' && !dfa && (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-white mt-12 max-w-2xl mx-auto shadow-sm">
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Simulador de AFD</h2>
            <p className="text-slate-500 mb-8">Utiliza el menú "Archivo &gt; Abrir" para cargar un archivo local, "Archivo &gt; Nuevo" para crear uno, o selecciona un modelo del menú "Ejemplos".</p>
          </div>
        )}

        {/* VISTA DE SIMULADOR (Con DFA cargado) */}
        {viewMode === 'simulator' && dfa && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            <div className="xl:col-span-8 space-y-6">
              <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Diagrama del Autómata</h2>
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-inner border ${
                    simulation?.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-300' :
                    simulation?.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {simulation?.status === 'accepted' && '[ CADENA ACEPTADA ]'}
                    {simulation?.status === 'rejected' && '[ CADENA RECHAZADA ]'}
                    {(simulation?.status === 'idle' || simulation?.status === 'running') && '[ EN PROGRESO ]'}
                  </div>
                </div>
                <DFADiagram dotCode={dotCode} />
              </section>

              <section className="bg-slate-800 rounded-xl shadow-lg p-6 text-white border border-slate-700">
                <div className="mb-6">
                  <p className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider">Cinta de Lectura</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 items-center">
                    <div className="h-8 w-8 flex-shrink-0 bg-slate-700 rounded-l-full"></div>
                    
                    {simulation?.currentString.map((sym, idx) => {
                      const isCurrent = idx === (simulation.history[simulation.currentStepIndex]?.stringIndex);
                      const isPast = idx < (simulation.history[simulation.currentStepIndex]?.stringIndex);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`h-12 min-w-[3rem] flex items-center justify-center text-xl font-mono border-2 transition-all duration-300 ${
                            isCurrent ? 'bg-yellow-400 border-yellow-300 text-slate-900 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10 font-black' : 
                            isPast ? 'bg-slate-600 border-slate-500 text-slate-400' : 
                            'bg-slate-700 border-slate-600 text-slate-300'
                          }`}
                        >
                          {sym}
                        </div>
                      );
                    })}
                    
                    <div className="h-8 w-8 flex-shrink-0 bg-slate-700 rounded-r-full"></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold transition-colors">
                      Reiniciar
                    </button>
                    <button onClick={handlePrev} disabled={simulation?.currentStepIndex === 0 || isPlaying} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold disabled:opacity-50 transition-colors">
                      Anterior
                    </button>
                    <button onClick={handleNext} disabled={isFinished || isPlaying} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold disabled:opacity-50 transition-colors">
                      Siguiente
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase">Velocidad</span>
                      <select 
                        value={speed} 
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="bg-slate-800 text-white border border-slate-600 text-sm rounded focus:ring-blue-500 focus:border-blue-500 p-1.5"
                      >
                        <option value={2000}>Lenta (2s)</option>
                        <option value={1000}>Normal (1s)</option>
                        <option value={400}>Rápida (0.4s)</option>
                      </select>
                    </div>
                    
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)} 
                      disabled={isFinished}
                      className={`px-8 py-3 rounded font-black uppercase tracking-wider transition-all ${
                        isPlaying 
                          ? 'bg-orange-600 hover:bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                          : 'bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                      } disabled:opacity-50 disabled:shadow-none`}
                    >
                      {isPlaying ? 'Pausar' : 'Reproducir'}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <StringsTable 
                dfa={dfa} 
                activeStringIndex={activeStringIndex} 
                results={results} 
                onSelectString={loadString} 
              />
              
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Tabla de Transiciones (Dinámica)</h3>
                <TransitionTable dfa={dfa} simulation={simulation} />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}