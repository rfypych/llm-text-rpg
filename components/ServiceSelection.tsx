
import React from 'react';

interface ServiceSelectionProps {
  onSelectService: (service: 'gemini' | 'ollama') => void;
}

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onSelectService }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-yellow-400">Pilih Layanan AI</h1>
          <p className="mt-2 text-gray-400">Pilih penyedia Model Bahasa (LLM) untuk menjadi Game Master Anda.</p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => onSelectService('gemini')}
            className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-md transition-transform duration-200 hover:bg-blue-500 hover:scale-105"
          >
            <h2 className="text-lg">Gunakan Gemini (Cloud)</h2>
            <p className="text-sm font-normal text-blue-200">Koneksi internet diperlukan. Didukung oleh Google AI.</p>
          </button>
          <button
            onClick={() => onSelectService('ollama')}
            className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-md transition-transform duration-200 hover:bg-green-500 hover:scale-105"
          >
            <h2 className="text-lg">Gunakan Ollama (Lokal)</h2>
            <p className="text-sm font-normal text-green-200">Membutuhkan Ollama yang berjalan di komputer Anda. Mode pengembangan.</p>
          </button>
        </div>
        <p className="text-xs text-center text-gray-500 pt-4">Pilihan Anda akan disimpan untuk sesi mendatang.</p>
      </div>
    </div>
  );
};
