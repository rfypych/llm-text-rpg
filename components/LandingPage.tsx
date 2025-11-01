import React from 'react';

interface LandingPageProps {
  onStartGame: () => void;
}

const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-slate-800/60 p-6 rounded-lg border border-slate-700 backdrop-blur-sm transition-transform duration-300 hover:scale-105 hover:border-amber-500">
    <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-xl font-bold font-serif text-amber-400 tracking-wider">{title}</h3>
    </div>
    <p className="text-slate-300">{children}</p>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStartGame }) => {
  return (
    <div 
        className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-100 font-sans"
        style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 1)), url('https://images.unsplash.com/photo-1534398395275-5c1d2179b5c3?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
    >
        <div className="max-w-4xl w-full text-center animate-fade-in-up">
            <header className="mb-12">
                <h1 className="text-5xl md:text-7xl font-bold font-serif text-amber-300 tracking-widest"
                    style={{ textShadow: '0 0 15px rgba(252, 211, 77, 0.5)' }}>
                    Neural Odyssey
                </h1>
                <p className="mt-4 text-xl md:text-2xl text-slate-300">Your Adventure, Forged by AI.</p>
            </header>

            <main className="mb-12 space-y-6">
                <p className="text-lg text-slate-200 max-w-2xl mx-auto">
                    Step into a world without limits. A living, breathing fantasy realm where the story is written by your actions. Powered by an advanced AI, every journey is unique, every choice matters, and no two adventures are ever the same.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
                    <FeatureCard icon="🌌" title="Infinite Worlds">
                        Explore procedurally generated landscapes where every mountain, forest, and village is part of a unique world, crafted just for you.
                    </FeatureCard>
                    <FeatureCard icon="🧠" title="Dynamic Storytelling">
                        An AI Game Master reacts to your every decision, weaving a personal narrative that adapts to your playstyle and choices.
                    </FeatureCard>
                     <FeatureCard icon="🧭" title="Limitless Freedom">
                        Forge your own path. Be a hero, a rogue, or anything in between. The only script is the one you write.
                    </FeatureCard>
                     <FeatureCard icon="⚙️" title="Multi-AI Backend">
                        Powered by leading AI models including Google Gemini, Groq, Mistral AI, and local models via Ollama.
                    </FeatureCard>
                </div>
            </main>

            <footer>
                <button
                    onClick={onStartGame}
                    className="bg-amber-600 text-slate-900 font-bold text-xl py-4 px-10 rounded-lg transition-all duration-300 hover:bg-amber-500 hover:scale-110 hover:shadow-2xl hover:shadow-amber-500/30"
                >
                    Begin Your Adventure
                </button>
            </footer>
        </div>
    </div>
  );
};