
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
      <div className="flex items-center bg-gray-800 rounded-lg p-1">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={isLoading ? "Menunggu respon dari Game Master..." : "Ketik perintahmu di sini..."}
          disabled={isLoading}
          className="flex-grow bg-transparent text-gray-100 placeholder-gray-500 p-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Kirim
        </button>
      </div>
    </form>
  );
};