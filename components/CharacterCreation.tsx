
import React, { useState } from 'react';

interface CharacterCreationProps {
  onStart: (name: string) => void;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onStart }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-yellow-400">Gemini Game Master</h1>
          <p className="mt-2 text-gray-400">An AI-Powered Text RPG Adventure</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="text-sm font-bold text-gray-300 block mb-2">
              Masukkan Nama Karaktermu
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Orion, Elara"
              className="w-full bg-gray-700 text-gray-100 placeholder-gray-500 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
              minLength={2}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-yellow-500 hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!name.trim()}
          >
            Mulai Petualangan
          </button>
        </form>
      </div>
    </div>
  );
};
