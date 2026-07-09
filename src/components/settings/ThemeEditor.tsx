import React from 'react';
import { X } from 'lucide-react';

interface ThemeEditorProps {
  onClose: () => void;
}

export function ThemeEditor({ onClose }: ThemeEditorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 relative shadow-xl border border-slate-100 dark:border-slate-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Personalizar tema y logo
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Aquí puedes configurar los colores de tu consultorio y subir tu logotipo personalizado.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
