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
  onShowGuide: () => void;
  hasActiveDFA: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function TopMenu({
  onOpenClick, onNewClick, onSaveClick, onExitClick, onLoadExample, onShowAbout, onShowHelp, onShowGuide, hasActiveDFA, isDarkMode, toggleTheme
}: TopMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => setActiveMenu(activeMenu === menu ? null : menu);
  const closeMenu = () => setActiveMenu(null);

  return (
    <div className="bg-slate-200 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between px-4 py-1 text-sm select-none relative z-50 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <div className="flex items-center">
        <div className="relative">
          <button className={`px-3 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-800 ${activeMenu === 'archivo' ? 'bg-slate-300 dark:bg-slate-800' : ''}`} onClick={() => toggleMenu('archivo')}>
            Archivo
          </button>
          {activeMenu === 'archivo' && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg py-1 rounded-sm">
              <button onClick={() => { onOpenClick(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600">Abrir...</button>
              <button onClick={() => { onNewClick(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600">Nuevo</button>
              <button onClick={() => { onSaveClick(); closeMenu(); }} disabled={!hasActiveDFA} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent">Guardar</button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button onClick={() => { onExitClick(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-red-500 hover:text-white dark:hover:bg-red-600">Salir</button>
            </div>
          )}
        </div>

        <div className="relative">
          <button className={`px-3 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-800 ${activeMenu === 'ejemplos' ? 'bg-slate-300 dark:bg-slate-800' : ''}`} onClick={() => toggleMenu('ejemplos')}>
            Ejemplos
          </button>
          {activeMenu === 'ejemplos' && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg py-1 rounded-sm">
              {dfaExamples.map(ex => (
                <button key={ex.id} onClick={() => { onLoadExample(ex.content); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 flex flex-col">
                  <span className="font-bold">{ex.name}</span>
                  <span className="text-xs opacity-80">{ex.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button className={`px-3 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-800 ${activeMenu === 'acerca' ? 'bg-slate-300 dark:bg-slate-800' : ''}`} onClick={() => toggleMenu('acerca')}>
            Ayuda
          </button>
          {activeMenu === 'acerca' && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg py-1 rounded-sm">
              <button onClick={() => { onShowGuide(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600">Guía Teórica (AFD)</button>
              <button onClick={() => { onShowHelp(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600">Manual de Usuario</button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button onClick={() => { onShowAbout(); closeMenu(); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600">Acerca de</button>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Tema (Sol / Luna SVG) */}
      <button onClick={toggleTheme} className="p-1.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
        {isDarkMode ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
        )}
      </button>

      {activeMenu && <div className="fixed inset-0 z-[-1]" onClick={closeMenu}></div>}
    </div>
  );
}