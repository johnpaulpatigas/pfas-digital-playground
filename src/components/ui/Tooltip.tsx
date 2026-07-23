import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="cursor-pointer"
      >
        {children || <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 transition-colors" />}
      </div>

      {visible && (
        <div
          className={`absolute z-50 w-64 p-3 text-xs leading-relaxed text-slate-800 bg-white border border-slate-300 rounded-lg shadow-lg ${positionClasses[position]} pointer-events-none`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
