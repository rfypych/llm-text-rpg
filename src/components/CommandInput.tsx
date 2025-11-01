import React, { useState } from 'react';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onSubmit, isLoading }) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onSubmit(command.trim());
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all duration-200">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={isLoading ? "Menunggu respon dari Game Master..." : "Ketik perintahmu di sini..."}
          disabled={isLoading}
          className="flex-grow bg-transparent text-slate-100 placeholder-slate-500 p-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Kirim
        </button>
      </div>
    </form>
  );
};