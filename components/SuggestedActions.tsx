import React from 'react';

interface SuggestedActionsProps {
  actions: string[];
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({ actions, onSubmit, isLoading }) => {
  if (isLoading || actions.length === 0) {
    return null; // Don't show anything if loading or no actions
  }

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-sm font-bold text-slate-400 flex-shrink-0 mr-2">Saran:</span>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onSubmit(action)}
            className="flex-shrink-0 bg-slate-700 text-slate-200 text-sm font-semibold py-1.5 px-3 rounded-full transition-colors duration-200 hover:bg-amber-600 hover:text-slate-900 whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};