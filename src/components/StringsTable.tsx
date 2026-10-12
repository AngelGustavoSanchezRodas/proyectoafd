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
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-2 font-bold flex justify-between items-center">
        <span>Cadenas a Analizar</span>
        <span className="text-xs bg-slate-700 px-2 py-1 rounded">Total: {dfa.testStrings.length}</span>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
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
              <tr key={idx} className={`border-b ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-3 font-semibold text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3 font-mono tracking-widest">{strArr.join(',')}</td>
                <td className="px-4 py-3 text-center">
                  {status === 'pending' && <span className="text-gray-400">Pendiente</span>}
                  {status === 'accepted' && <span className="text-green-600 font-bold">[ Aceptada ]</span>}
                  {status === 'rejected' && <span className="text-red-600 font-bold">[ Rechazada ]</span>}
                  {status === 'error' && <span className="text-orange-600 font-bold">[ Error ]</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => onSelectString(idx)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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