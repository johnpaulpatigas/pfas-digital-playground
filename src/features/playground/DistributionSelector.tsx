import React from 'react';
import type { DistributionParams, DistributionType } from '../../types';

interface DistributionSelectorProps {
  distribution: DistributionParams;
  onChangeDistributionType: (type: DistributionType) => void;
  onChangeValue: (key: string, value: number) => void;
  unit: string;
}

export const DistributionSelector: React.FC<DistributionSelectorProps> = ({
  distribution,
  onChangeDistributionType,
  onChangeValue,
  unit,
}) => {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as DistributionType;
    onChangeDistributionType(type);
  };

  const handleInputChange = (key: string, rawVal: string) => {
    const val = parseFloat(rawVal);
    if (!isNaN(val)) {
      onChangeValue(key, val);
    }
  };

  return (
    <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
      {/* Distribution Type Selection */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-mono text-slate-500">Distribution</label>
        <select
          value={distribution.type}
          onChange={handleTypeChange}
          className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        >
          <option value="fixed">Fixed Value</option>
          <option value="uniform">Uniform (Min - Max)</option>
          <option value="normal">Normal (Mean, SD)</option>
          <option value="lognormal">Lognormal (Mean, SD)</option>
          <option value="triangular">Triangular (Min, Mode, Max)</option>
        </select>
      </div>

      {/* Dynamic Input Fields based on selected Distribution */}
      <div className="grid grid-cols-2 gap-2 pt-0.5 font-mono text-xs">
        {distribution.type === 'fixed' && (
          <div className="col-span-2 space-y-1">
            <span className="text-[11px] text-slate-500">Value ({unit})</span>
            <input
              type="number"
              step="any"
              value={distribution.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        {distribution.type === 'uniform' && (
          <>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Min ({unit})</span>
              <input
                type="number"
                step="any"
                value={distribution.min}
                onChange={(e) => handleInputChange('min', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Max ({unit})</span>
              <input
                type="number"
                step="any"
                value={distribution.max}
                onChange={(e) => handleInputChange('max', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {(distribution.type === 'normal' || distribution.type === 'lognormal') && (
          <>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Mean ({unit})</span>
              <input
                type="number"
                step="any"
                value={distribution.mean}
                onChange={(e) => handleInputChange('mean', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Std Dev (SD)</span>
              <input
                type="number"
                step="any"
                value={distribution.sd}
                onChange={(e) => handleInputChange('sd', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {distribution.type === 'triangular' && (
          <>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Min ({unit})</span>
              <input
                type="number"
                step="any"
                value={distribution.min}
                onChange={(e) => handleInputChange('min', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Mode ({unit})</span>
              <input
                type="number"
                step="any"
                value={distribution.mode}
                onChange={(e) => handleInputChange('mode', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-[11px] text-slate-500">Max ({unit})</span>
              <input
                type="number"
                step="any"
                value={distribution.max}
                onChange={(e) => handleInputChange('max', e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
