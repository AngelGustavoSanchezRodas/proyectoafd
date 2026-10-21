// src/components/StringsTable.tsx
import { DFA } from '../types/dfa';

interface StringsTableProps {
  dfa: DFA;
  activeStringIndex: number;
  results: Record<number, 'accepted' | 'rejected' | 'error' | 'pending'>;
  onSelectString: (index: number) => void;
}

export default function StringsTable({ dfa, activeStringIndex, results, onSelectString }: StringsTableProps) {
  return (
    <section 
      id="section-strings-table"
      aria-label="Tabla de cadenas de prueba"
      className="bg-white/80 dark:bg-slate-900/80 mac-panel-vibrancy rounded-xl shadow-sm border border-black/10 dark:border-white/10 overflow-hidden transition-colors duration-200"
    >
      {/* Cabecera estilo barra de herramientas de panel macOS */}
      <div className="bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2.5 border-b border-black/5 dark:border-white/10 flex justify-between items-center select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true"></span>
          <h2 className="font-semibold text-xs tracking-tight text-slate-800 dark:text-slate-200">
            Cadenas de Prueba
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
          {dfa.testStrings.length} cadenas
        </span>
      </div>

      <div className="overflow-x-auto max-h-[280px]">
        <table 
          id="table-test-strings"
          aria-label="Cadenas a evaluar"
          className="w-full text-xs text-left text-slate-700 dark:text-slate-300"
        >
          <caption className="sr-only">
            Listado de cadenas de entrada para validar la aceptación o rechazo en el autómata
          </caption>
          <thead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 border-b border-black/5 dark:border-white/10 sticky top-0 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-3 py-2 w-10 text-center">#</th>
              <th scope="col" className="px-3 py-2">Cadena</th>
              <th scope="col" className="px-3 py-2 text-center">Evaluación</th>
              <th scope="col" className="px-3 py-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {dfa.testStrings.map((strArr, idx) => {
              const status = results[idx] || 'pending';
              const isActive = idx === activeStringIndex;
              
              return (
                <tr
                  key={idx}
                  id={`row-string-${idx}`}
                  onClick={() => onSelectString(idx)}
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <th scope="row" className="px-3 py-2 text-center font-mono opacity-60 font-normal">
                    {idx + 1}
                  </th>
                  <td className="px-3 py-2 font-mono tracking-wide">
                    {strArr.length === 0 ? <span className="italic opacity-50">&epsilon; (vacía)</span> : strArr.join(', ')}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {status === 'pending' && (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true"></span>
                        <span>Pendiente</span>
                      </span>
                    )}
                    {status === 'accepted' && (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                        <span>Aceptada</span>
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true"></span>
                        <span>Rechazada</span>
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                        <span>Error</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      id={`btn-select-string-${idx}`}
                      type="button"
                      aria-label={`Seleccionar y cargar en cinta la cadena ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectString(idx);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-medium'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isActive ? 'Activa' : 'Cargar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}