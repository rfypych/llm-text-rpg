import React, { useState } from 'react';

interface CharacterCreationProps {
  onStart: (name: string) => void;
  onBack: () => void;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onStart, onBack }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-lg shadow-lg border-2 border-slate-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-serif text-amber-400 tracking-widest">Gemini Game Master</h1>
          <p className="mt-2 text-slate-400">An AI-Powered Text RPG Adventure</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="text-sm font-bold text-slate-300 block mb-2">
              Masukkan Nama Karaktermu
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Orion, Elara"
              className="w-full bg-slate-700 text-slate-100 placeholder-slate-500 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              minLength={2}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-600 text-gray-900 font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-amber-500 hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed"
            disabled={!name.trim()}
          >
            Mulai Petualangan
          </button>
        </form>
         <div className="text-center pt-2 border-t border-slate-700/50">
            <button
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200 pt-4"
            >
              Ubah Layanan AI
            </button>
        </div>
      </div>
    </div>
  );
};