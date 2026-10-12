// src/app/page.tsx
"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { parseDFA } from "@/core/parser";
import { DFAEngine } from "@/core/engine";
import { DFA, SimulationState } from "@/types/dfa";
import { generateDotCode } from "@/utils/graphviz";
import DFADiagram from "@/components/DFADiagram";
import TransitionTable from "@/components/TransitionTable";

export default function Home() {
  const [dfa, setDfa] = useState<DFA | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Instanciamos el motor solo cuando cambia el DFA
  const engine = useMemo(() => dfa ? new DFAEngine(dfa) : null, [dfa]);

  // Manejar subida del archivo TXT
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedDfa = parseDFA(content);
        setDfa(parsedDfa);
        setError(null);
        
        // Inicializamos el motor con la primera cadena cargada (índice 0)
        const newEngine = new DFAEngine(parsedDfa);
        setSimulation(newEngine.initialize(0));
      } catch (err: any) {
        setError(err.message || "Error al parsear el archivo.");
        setDfa(null);
        setSimulation(null);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Resetear input
  };

  // Controles Manuales
  const handleNext = () => {
    if (engine && simulation) {
      setSimulation(engine.stepForward(simulation));
    }
  };

  const handlePrev = () => {
    if (engine && simulation) {
      setSimulation(engine.stepBackward(simulation));
    }
  };

  // Generamos el código Graphviz al vuelo basado en el estado
  const dotCode = generateDotCode(simulation, dfa);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-black text-slate-800">Prompt Maestro <span className="text-blue-600">AFD</span></h1>
        <p className="text-gray-500">Plataforma Web Interactiva para Autómatas Finitos Deterministas</p>
      </header>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 shadow-sm">
          <p className="font-bold">Error de Validación</p>
          <p>{error}</p>
        </div>
      )}

      {!dfa ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-white">
          <h2 className="text-xl font-semibold mb-4">Carga la definición de tu autómata</h2>
          <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
            Seleccionar archivo .txt
            <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel Izquierdo: Visualización y Controles */}
          <div className="space-y-6">
            <section className="bg-white p-4 rounded-xl shadow border">
              <h2 className="text-lg font-bold mb-4 flex justify-between items-center">
                <span>Diagrama del AFD</span>
                <span className={`px-3 py-1 text-sm rounded-full text-white ${
                  simulation?.status === 'accepted' ? 'bg-green-500' :
                  simulation?.status === 'rejected' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}>
                  Estado: {simulation?.status.toUpperCase()}
                </span>
              </h2>
              
              <DFADiagram dotCode={dotCode} />
              
              {/* Controles de Simulación */}
              <div className="mt-4 flex flex-col gap-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Cadena procesando:</p>
                  <p className="font-mono text-lg tracking-widest bg-white p-2 rounded border inline-block">
                    {simulation?.currentString.map((sym, idx) => (
                      <span key={idx} className={`${
                        idx === (simulation.history[simulation.currentStepIndex]?.stringIndex) ? 'bg-yellow-300 font-bold' : ''
                      } px-1 rounded`}>
                        {sym}
                      </span>
                    ))}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={handlePrev} disabled={simulation?.currentStepIndex === 0} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50">
                    ← Paso Anterior
                  </button>
                  <button onClick={handleNext} disabled={simulation?.status === 'accepted' || simulation?.status === 'rejected' || simulation?.status === 'error'} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
                    Paso Siguiente →
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Panel Derecho: Datos y Tablas */}
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-bold mb-4">Tabla de Transiciones</h2>
              <TransitionTable dfa={dfa} simulation={simulation} />
            </section>
          </div>

        </div>
      )}
    </div>
  );
}