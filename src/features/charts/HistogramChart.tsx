import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { IterationResult, SummaryStatistics } from '../../types';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

interface HistogramChartProps {
  results: IterationResult[];
  summaryStats?: SummaryStatistics;
}

const COMPOUND_COLORS: Record<string, string> = {
  pfoa: '#2563eb', // Blue
  pfos: '#0d9488', // Teal
  pfhxs: '#7c3aed', // Purple
  pfna: '#d97706', // Amber
  genx: '#e11d48', // Rose
};

export const HistogramChart: React.FC<HistogramChartProps> = ({ results }) => {
  const { mode } = useSimulationStore();
  const isSimpleMode = mode === 'simple';
  const [selectedCompoundId, setSelectedCompoundId] = useState<string>('pfoa');

  const { binData, activeMean, activeP95, activeColor } = useMemo(() => {
    if (!results || results.length === 0) {
      return { binData: [], activeMean: 0, activeP95: 0, activeColor: '#2563eb' };
    }

    const compound = PFAS_COMPOUNDS.find((c) => c.id === selectedCompoundId) || PFAS_COMPOUNDS[0];
    const color = COMPOUND_COLORS[compound.id] || '#2563eb';

    const values = results.map((r) => {
      if (isSimpleMode && r.compoundOutputs) {
        return r.compoundOutputs[compound.id]?.steadyStateConcentration ?? r.steadyStateConcentration;
      }
      return r.steadyStateConcentration;
    });

    const sortedVals = [...values].sort((a, b) => a - b);
    const min = sortedVals[0] || 0;
    const max = sortedVals[sortedVals.length - 1] || 1;
    const sum = sortedVals.reduce((a, b) => a + b, 0);
    const mean = sum / sortedVals.length;
    const p95 = sortedVals[Math.floor(sortedVals.length * 0.95)] || 0;

    const binCount = 30;
    const binWidth = (max - min) / binCount || 0.01;

    const bins = new Array(binCount).fill(0).map((_, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      binLabel: (min + (i + 0.5) * binWidth).toFixed(3),
      count: 0,
      frequencyPercent: 0,
    }));

    values.forEach((v) => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });

    bins.forEach((b) => {
      b.frequencyPercent = (b.count / values.length) * 100;
    });

    return {
      binData: bins,
      activeMean: parseFloat(mean.toFixed(4)),
      activeP95: parseFloat(p95.toFixed(4)),
      activeColor: color,
    };
  }, [results, isSimpleMode, selectedCompoundId]);

  return (
    <div className="w-full space-y-2 font-mono select-none">
      {isSimpleMode && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-[10px]">
          <span className="text-slate-500 font-sans text-[11px] font-semibold pr-1">PFAS View:</span>
          {PFAS_COMPOUNDS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCompoundId(c.id)}
              className={`px-2 py-0.5 rounded font-bold border transition-all cursor-pointer ${
                selectedCompoundId === c.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="w-full h-64 sm:h-72 md:h-80 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={binData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="binLabel"
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={20}
              label={{ value: 'Blood Serum Concentration Css (µg/L)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <YAxis
              width={40}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <RechartsTooltip
              formatter={(value: unknown) => [`${parseFloat(String(value ?? 0)).toFixed(2)}%`, 'Frequency']}
              labelFormatter={(label: unknown) => `Conc: ${String(label ?? '')} µg/L`}
            />
            <Bar dataKey="frequencyPercent" fill={activeColor} radius={[2, 2, 0, 0]} opacity={0.85} />
            <ReferenceLine x={activeMean.toFixed(3)} stroke="#0d9488" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Mean', fill: '#0d9488', fontSize: 9, position: 'insideTopLeft' }} />
            <ReferenceLine x={activeP95.toFixed(3)} stroke="#dc2626" strokeWidth={2} label={{ value: 'P95', fill: '#dc2626', fontSize: 9, position: 'insideTopLeft' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

