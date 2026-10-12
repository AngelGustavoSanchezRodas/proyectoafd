// src/components/TopMenu.tsx
import { useState } from 'react';
import { dfaExamples } from '../utils/examples';

interface TopMenuProps {
  onOpenClick: () => void;
  onNewClick: () => void;
  onSaveClick: () => void;
  onExitClick: () => void;
  onLoadExample: (content: string) => void;
  onShowAbout: () => void;
  onShowHelp: () => void;
  hasActiveDFA: boolean;
}

export default function TopMenu({
  onOpenClick, onNewClick, onSaveClick, onExitClick, onLoadExample, onShowAbout, onShowHelp, hasActiveDFA
}: TopMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <div className="bg-slate-200 border-b border-slate-300 flex items-center px-4 py-1 text-sm select-none relative z-50">
      {/* Menú Archivo */}
      <div className="relative">
        <button 
          className={`px-3 py-1 rounded hover:bg-slate-300 ${activeMenu === 'archivo' ? 'bg-slate-300' : ''}`}
          onClick={() => toggleMenu('archivo')}
        >
          Archivo
        </button>
        {activeMenu === 'archivo' && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-300 shadow-lg py-1 rounded-sm">
            <button onClick={() => { onOpenClick(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white">Abrir...</button>
            <button onClick={() => { onNewClick(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white">Nuevo</button>
            <button onClick={() => { onSaveClick(); closeMenu(); }} disabled={!hasActiveDFA} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white disabled:text-gray-400 disabled:hover:bg-transparent">Guardar</button>
            <div className="border-t border-slate-200 my-1"></div>
            <button onClick={() => { onExitClick(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-red-500 hover:text-white">Salir</button>
          </div>
        )}
      </div>

      {/* Menú Ejemplos */}
      <div className="relative">
        <button 
          className={`px-3 py-1 rounded hover:bg-slate-300 ${activeMenu === 'ejemplos' ? 'bg-slate-300' : ''}`}
          onClick={() => toggleMenu('ejemplos')}
        >
          Ejemplos
        </button>
        {activeMenu === 'ejemplos' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 shadow-lg py-1 rounded-sm">
            {dfaExamples.map(ex => (
              <button 
                key={ex.id} 
                onClick={() => { onLoadExample(ex.content); closeMenu(); }} 
                className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white flex flex-col"
              >
                <span className="font-bold">{ex.name}</span>
                <span className="text-xs opacity-80">{ex.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menú Acerca de */}
      <div className="relative">
        <button 
          className={`px-3 py-1 rounded hover:bg-slate-300 ${activeMenu === 'acerca' ? 'bg-slate-300' : ''}`}
          onClick={() => toggleMenu('acerca')}
        >
          Acerca de...
        </button>
        {activeMenu === 'acerca' && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-300 shadow-lg py-1 rounded-sm">
            <button onClick={() => { onShowHelp(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white">Ayuda (Manual)</button>
            <div className="border-t border-slate-200 my-1"></div>
            <button onClick={() => { onShowAbout(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white">Acerca de</button>
          </div>
        )}
      </div>

      {/* Overlay invisible para cerrar menús al hacer clic fuera */}
      {activeMenu && (
        <div className="fixed inset-0 z-[-1]" onClick={closeMenu}></div>
      )}
    </div>
  );
}