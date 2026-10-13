import { DFA } from '../types/dfa';

interface StringsTableProps {
  dfa: DFA;
  activeStringIndex: number;
  results: Record<number, 'accepted' | 'rejected' | 'error' | 'pending'>;
  onSelectString: (index: number) => void;
}

export default function StringsTable({ dfa, activeStringIndex, results, onSelectString }: StringsTableProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
      <div className="bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2 font-bold flex justify-between items-center">
        <span>Cadenas a Analizar</span>
        <span className="text-xs bg-slate-300 dark:bg-slate-700 px-2 py-1 rounded">Total: {dfa.testStrings.length}</span>
      </div>
      <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Cadena</th>
            <th className="px-4 py-3 text-center">Estado</th>
            <th className="px-4 py-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {dfa.testStrings.map((strArr, idx) => {
            const status = results[idx] || 'pending';
            const isActive = idx === activeStringIndex;
            
            return (
              <tr key={idx} className={`border-b dark:border-slate-700 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <td className="px-4 py-3 font-semibold opacity-70">{idx + 1}</td>
                <td className="px-4 py-3 font-mono tracking-widest">{strArr.join(',')}</td>
                <td className="px-4 py-3 text-center">
                  {status === 'pending' && <span className="opacity-50">Pendiente</span>}
                  {status === 'accepted' && <span className="text-green-600 dark:text-green-400 font-bold">[ Aceptada ]</span>}
                  {status === 'rejected' && <span className="text-red-600 dark:text-red-400 font-bold">[ Rechazada ]</span>}
                  {status === 'error' && <span className="text-orange-600 font-bold">[ Error ]</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => onSelectString(idx)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      isActive ? 'bg-blue-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {isActive ? 'Simulando' : 'Cargar'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}