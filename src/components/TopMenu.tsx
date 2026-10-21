// src/components/TopMenu.tsx
"use client";

import { useState } from 'react';
import { dfaExamples } from '../utils/examples';

interface TopMenuProps {
  onOpenClick: () => void;
  onNewClick: () => void;
  onSaveClick: () => void;
  onExitClick: () => void;
  onLoadExample: (content: string, name?: string) => void;
  onShowAbout: () => void;
  onShowHelp: () => void;
  onShowGuide: () => void;
  hasActiveDFA: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  viewMode: 'simulator' | 'editor';
  setViewMode: (mode: 'simulator' | 'editor') => void;
}

export default function TopMenu({
  onOpenClick,
  onNewClick,
  onSaveClick,
  onExitClick,
  onLoadExample,
  onShowAbout,
  onShowHelp,
  onShowGuide,
  hasActiveDFA,
  isDarkMode,
  toggleTheme,
  viewMode,
  setViewMode
}: TopMenuProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdown = () => setActiveDropdown(null);

  return (
    <header 
      id="app-topbar"
      role="banner"
      aria-label="Barra de herramientas principal"
      className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Menús de Navegación de la Aplicación */}
        <nav 
          aria-label="Menú principal de la aplicación" 
          className="flex items-center space-x-1 text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          
          {/* Menú Archivo */}
          <div className="relative">
            <button
              id="btn-menu-archivo"
              aria-haspopup="true"
              aria-expanded={activeDropdown === 'archivo'}
              aria-controls="menu-archivo-dropdown"
              onClick={() => toggleDropdown('archivo')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                activeDropdown === 'archivo'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Archivo</span>
              <svg className="w-3 h-3 opacity-60" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {activeDropdown === 'archivo' && (
              <div 
                id="menu-archivo-dropdown"
                role="menu"
                aria-label="Opciones de archivo"
                className="absolute top-full left-0 mt-1.5 w-52 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-xl py-1.5 text-xs z-50"
              >
                <button
                  id="item-abrir-archivo"
                  role="menuitem"
                  onClick={() => { onOpenClick(); closeDropdown(); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>Abrir Archivo (.txt)...</span>
                </button>
                <button
                  id="item-nuevo-automata"
                  role="menuitem"
                  onClick={() => { onNewClick(); closeDropdown(); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>Nuevo Autómata</span>
                </button>
                <button
                  id="item-guardar-archivo"
                  role="menuitem"
                  onClick={() => { onSaveClick(); closeDropdown(); }}
                  disabled={!hasActiveDFA}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit"
                >
                  <span>Guardar Archivo</span>
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700/70 my-1" role="separator"></div>
                <button
                  id="item-limpiar-cerrar"
                  role="menuitem"
                  onClick={() => { onExitClick(); closeDropdown(); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 flex items-center justify-between transition-colors"
                >
                  <span>Limpiar / Cerrar</span>
                </button>
              </div>
            )}
          </div>

          {/* Menú Ejemplos */}
          <div className="relative">
            <button
              id="btn-menu-ejemplos"
              aria-haspopup="true"
              aria-expanded={activeDropdown === 'ejemplos'}
              aria-controls="menu-ejemplos-dropdown"
              onClick={() => toggleDropdown('ejemplos')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                activeDropdown === 'ejemplos'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Ejemplos</span>
              <svg className="w-3 h-3 opacity-60" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {activeDropdown === 'ejemplos' && (
              <div 
                id="menu-ejemplos-dropdown"
                role="menu"
                aria-label="Modelos preconfigurados"
                className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-xl py-1.5 text-xs z-50"
              >
                {dfaExamples.map((ex) => (
                  <button
                    key={ex.id}
                    id={`item-ejemplo-${ex.id}`}
                    role="menuitem"
                    onClick={() => { onLoadExample(ex.content, `${ex.name.toLowerCase().replace(/\s+/g, '_')}.txt`); closeDropdown(); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white flex flex-col group transition-colors rounded-sm"
                  >
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-white">
                      {ex.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 line-clamp-1">
                      {ex.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menú Documentación */}
          <div className="relative">
            <button
              id="btn-menu-ayuda"
              aria-haspopup="true"
              aria-expanded={activeDropdown === 'ayuda'}
              aria-controls="menu-ayuda-dropdown"
              onClick={() => toggleDropdown('ayuda')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                activeDropdown === 'ayuda'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Documentación</span>
              <svg className="w-3 h-3 opacity-60" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {activeDropdown === 'ayuda' && (
              <div 
                id="menu-ayuda-dropdown"
                role="menu"
                aria-label="Documentación e información"
                className="absolute top-full left-0 mt-1.5 w-56 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-xl py-1.5 text-xs z-50"
              >
                <button
                  id="item-guia-teorica"
                  role="menuitem"
                  onClick={() => { onShowGuide(); closeDropdown(); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Guía Teórica de AFD
                </button>
                <button
                  id="item-manual-usuario"
                  role="menuitem"
                  onClick={() => { onShowHelp(); closeDropdown(); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Manual de Usuario
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700/70 my-1" role="separator"></div>
                <button
                  id="item-acerca-de"
                  role="menuitem"
                  onClick={() => { onShowAbout(); closeDropdown(); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Acerca del Proyecto
                </button>
              </div>
            )}
          </div>

        </nav>

        {/* Lado Derecho: Control Segmentado y Tema */}
        <div className="flex items-center space-x-3">
          
          {/* Selector Segmentado de Vista (Simulador / Editor) */}
          <div 
            role="group" 
            aria-label="Selector de modo de vista"
            className="bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-0.5 text-xs font-medium"
          >
            <button
              id="btn-toggle-simulador"
              aria-pressed={viewMode === 'simulator'}
              onClick={() => setViewMode('simulator')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'simulator'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Simulador
            </button>
            <button
              id="btn-toggle-editor"
              aria-pressed={viewMode === 'editor'}
              onClick={() => setViewMode('editor')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Editor
            </button>
          </div>

          {/* Botón de Alternancia de Tema (Modo Claro / Oscuro) */}
          <button
            id="btn-toggle-tema"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-colors"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4 stroke-current fill-none" aria-hidden="true" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="w-4 h-4 stroke-current fill-none" aria-hidden="true" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Capa de fondo para cerrar menús desplegables */}
      {activeDropdown && (
        <div className="fixed inset-0 z-30" onClick={closeDropdown} aria-hidden="true"></div>
      )}
    </header>
  );
}
