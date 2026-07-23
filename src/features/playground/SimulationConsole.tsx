import React from 'react';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { Terminal, Trash2 } from 'lucide-react';

export const SimulationConsole: React.FC = () => {
  const { logs, clearLogs } = useSimulationStore();

  return (
    <div className="academic-panel p-4 rounded-xl space-y-2.5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-700" />
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Simulation Execution Log
          </span>
        </div>
        <button
          onClick={clearLogs}
          className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear Console</span>
        </button>
      </div>

      <div className="h-28 overflow-y-auto bg-slate-900 rounded-lg p-3 space-y-1 text-slate-200">
        {logs.map((log, idx) => (
          <div key={idx} className="text-[11px] leading-relaxed">
            <span className="text-slate-400">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
