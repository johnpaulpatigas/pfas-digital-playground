import type React from 'react';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

interface CompoundViewSelectorProps {
  activeCompoundId: string;
  onSelect: (compoundId: string) => void;
}

/**
 * Shared PFAS compound selector used by charts that can display any compound.
 */
export const CompoundViewSelector: React.FC<CompoundViewSelectorProps> = ({
  activeCompoundId,
  onSelect,
}) => (
  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-[10px]">
    <span className="text-slate-500 font-sans text-[11px] font-semibold pr-1">PFAS View:</span>
    {PFAS_COMPOUNDS.map((c) => (
      <button
        key={c.id}
        type="button"
        onClick={() => onSelect(c.id)}
        className={`px-2 py-0.5 rounded font-bold border transition-all cursor-pointer ${
          activeCompoundId === c.id
            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        {c.name.split(' ')[0]}
      </button>
    ))}
  </div>
);
