import React, { useState } from 'react';

interface ServiceSelectionProps {
  onSelectService: (service: 'gemini' | 'ollama' | 'mistral' | 'groq') => void;
}

const MISTRAL_MODELS = [
    { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Model unggulan untuk penalaran kompleks.', recommended: true },
    { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Cepat dan efisien untuk tugas-tugas sederhana.'},
    { id: 'open-mistral-nemo', name: 'Mistral Nemo', description: 'Model terbuka baru, performa tinggi.'}
];

const GROQ_MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Model serbaguna yang kuat untuk kualitas & penalaran tinggi.', recommended: true },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Sangat cepat, ideal untuk respons instan dan dialog cepat.', recommended: true },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', description: 'Model Llama 4 serbaguna, seimbang antara kecepatan dan kemampuan.'},
    { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', description: 'Model 32B yang kuat dari seri Qwen.' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', description: 'Model open-source yang sangat besar untuk narasi yang mendalam.' },
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2 0905', description: 'Model dari Moonshot AI, dikenal dengan konteks yang panjang.' }
];


export const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onSelectService }) => {
  const [currentView, setCurrentView] = useState<'main' | 'mistral_key' | 'mistral_model' | 'groq_key' | 'groq_model'>('main');
  
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [selectedMistralModel, setSelectedMistralModel] = useState(MISTRAL_MODELS.find(m => m.recommended)?.id || MISTRAL_MODELS[0].id);
  const [selectedGroqModel, setSelectedGroqModel] = useState(GROQ_MODELS.find(m => m.recommended)?.id || GROQ_MODELS[0].id);


  const handleMistralKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mistralApiKey.trim()) {
      localStorage.setItem('mistralApiKey', mistralApiKey.trim());
      setCurrentView('mistral_model');
    }
  };
  
  const handleMistralModelSubmit = () => {
      localStorage.setItem('mistralModel', selectedMistralModel);
      onSelectService('mistral');
  }

  const handleGroqKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groqApiKey.trim()) {
      localStorage.setItem('groqApiKey', groqApiKey.trim());
      setCurrentView('groq_model');
    }
  };
  
  const handleGroqModelSubmit = () => {
      localStorage.setItem('groqModel', selectedGroqModel);
      onSelectService('groq');
  }

  const ModelSelectionUI: React.FC<{
      title: string;
      color: string;
      models: typeof GROQ_MODELS;
      selectedModel: string;
      onModelSelect: (id: string) => void;
      onBack: () => void;
      onConfirm: () => void;
  }> = ({ title, color, models, selectedModel, onModelSelect, onBack, onConfirm }) => (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
        <div className={`w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700`}>
          <div className="text-center">
            <h1 className={`text-3xl font-bold text-${color}-400`}>{title}</h1>
            <p className="mt-2 text-gray-400">Pilih model yang akan menjadi Game Master Anda.</p>
          </div>
          <div className="space-y-3">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedModel === model.id ? `border-${color}-500 bg-${color}-900/50 scale-105` : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'}`}
              >
                <div className="flex justify-between items-center">
                    <span className="font-bold">{model.name}</span>
                    {model.recommended && <span className={`text-xs font-bold bg-${color}-500 text-white py-1 px-2 rounded-full`}>⭐ Direkomendasikan</span>}
                </div>
                <p className="text-sm text-gray-400 mt-1">{model.description}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-gray-500 hover:scale-105"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full bg-${color}-600 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-${color}-500 hover:scale-105`}
            >
              Mulai Petualangan
            </button>
          </div>
        </div>
      </div>
  );


  switch(currentView) {
      case 'groq_key':
        return (
          <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-purple-400">Konfigurasi Groq</h1>
                <p className="mt-2 text-gray-400">Masukkan kunci API Groq Anda untuk melanjutkan.</p>
              </div>
              <form onSubmit={handleGroqKeySubmit} className="space-y-4">
                <div>
                    <label htmlFor="groq-key" className="text-sm font-bold text-gray-300 block mb-2">
                    Kunci API Groq
                    </label>
                    <input
                    id="groq-key"
                    type="password"
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-gray-700 text-gray-100 placeholder-gray-500 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    />
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setCurrentView('main')}
                        className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-gray-500 hover:scale-105"
                    >
                        Kembali
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-purple-500 hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={!groqApiKey.trim()}
                    >
                        Lanjutkan
                    </button>
                </div>
              </form>
              <p className="text-xs text-center text-gray-500 pt-2">Kunci Anda disimpan dengan aman di penyimpanan lokal browser Anda dan tidak pernah dikirim ke tempat lain selain ke Groq.</p>
            </div>
          </div>
        );
      case 'groq_model':
        return <ModelSelectionUI 
            title="Pilih Model Groq"
            color="purple"
            models={GROQ_MODELS}
            selectedModel={selectedGroqModel}
            onModelSelect={setSelectedGroqModel}
            onBack={() => setCurrentView('groq_key')}
            onConfirm={handleGroqModelSubmit}
        />;
      case 'mistral_key':
        return (
          <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-orange-400">Konfigurasi Mistral AI</h1>
                <p className="mt-2 text-gray-400">Masukkan kunci API Mistral Anda untuk melanjutkan.</p>
              </div>
              <form onSubmit={handleMistralKeySubmit} className="space-y-4">
                <div>
                    <label htmlFor="mistral-key" className="text-sm font-bold text-gray-300 block mb-2">
                    Kunci API Mistral
                    </label>
                    <input
                    id="mistral-key"
                    type="password"
                    value={mistralApiKey}
                    onChange={(e) => setMistralApiKey(e.target.value)}
                    placeholder="Masukkan kunci API Anda di sini"
                    className="w-full bg-gray-700 text-gray-100 placeholder-gray-500 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    />
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setCurrentView('main')}
                        className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-gray-500 hover:scale-105"
                    >
                        Kembali
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:bg-orange-500 hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={!mistralApiKey.trim()}
                    >
                        Lanjutkan
                    </button>
                </div>
              </form>
              <p className="text-xs text-center text-gray-500 pt-2">Kunci Anda disimpan dengan aman di penyimpanan lokal browser Anda dan tidak pernah dikirim ke tempat lain selain ke Mistral.</p>
            </div>
          </div>
        );
    case 'mistral_model':
        return <ModelSelectionUI 
            title="Pilih Model Mistral"
            color="orange"
            models={MISTRAL_MODELS}
            selectedModel={selectedMistralModel}
            onModelSelect={setSelectedMistralModel}
            onBack={() => setCurrentView('mistral_key')}
            onConfirm={handleMistralModelSubmit}
        />;
    default:
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
                    className="w-full text-left bg-blue-600 text-white font-bold py-4 px-5 rounded-md transition-transform duration-200 hover:bg-blue-500 hover:scale-105"
                >
                    <h2 className="text-lg">Gunakan Gemini (Cloud)</h2>
                    <p className="text-sm font-normal text-blue-200">Koneksi internet diperlukan. Didukung oleh Google AI.</p>
                </button>
                <button
                    onClick={() => setCurrentView('mistral_key')}
                    className="w-full text-left bg-orange-600 text-white font-bold py-4 px-5 rounded-md transition-transform duration-200 hover:bg-orange-500 hover:scale-105"
                >
                    <h2 className="text-lg">Gunakan Mistral AI (Cloud)</h2>
                    <p className="text-sm font-normal text-orange-200">Membutuhkan kunci API Anda sendiri dari Mistral AI.</p>
                </button>
                <button
                    onClick={() => setCurrentView('groq_key')}
                    className="w-full text-left bg-purple-600 text-white font-bold py-4 px-5 rounded-md transition-transform duration-200 hover:bg-purple-500 hover:scale-105"
                >
                    <h2 className="text-lg">Gunakan Groq (Cloud)</h2>
                    <p className="text-sm font-normal text-purple-200">Membutuhkan kunci API Anda sendiri. Sangat cepat.</p>
                </button>
                <button
                    onClick={() => onSelectService('ollama')}
                    className="w-full text-left bg-green-600 text-white font-bold py-4 px-5 rounded-md transition-transform duration-200 hover:bg-green-500 hover:scale-105"
                >
                    <h2 className="text-lg">Gunakan Ollama (Lokal)</h2>
                    <p className="text-sm font-normal text-green-200">Membutuhkan Ollama yang berjalan di komputer Anda. Mode pengembangan.</p>
                </button>
                </div>
                <p className="text-xs text-center text-gray-500 pt-4">Pilihan Anda akan disimpan untuk sesi mendatang.</p>
            </div>
            </div>
        );
  }
};