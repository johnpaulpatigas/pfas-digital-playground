import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { IterationResult } from '../../types';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

interface ScatterPlotChartProps {
  results: IterationResult[];
}

export const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({ results }) => {
  const { mode } = useSimulationStore();
  const isSimpleMode = mode === 'simple';
  const [selectedCompoundId, setSelectedCompoundId] = useState<string>('pfoa');

  const { safePoints, exceedingPoints, activeCompound } = useMemo(() => {
    if (!results || results.length === 0) return { safePoints: [], exceedingPoints: [], activeCompound: PFAS_COMPOUNDS[0] };

    const compound = PFAS_COMPOUNDS.find((c) => c.id === selectedCompoundId) || PFAS_COMPOUNDS[0];
    const step = Math.max(1, Math.floor(results.length / 500));
    const safe: Array<{ x: number; y: number; bw: number; hq: number; bb: number }> = [];
    const exceeding: Array<{ x: number; y: number; bw: number; hq: number; bb: number }> = [];

    for (let i = 0; i < results.length; i += step) {
      const r = results[i];
      const out = isSimpleMode && r.compoundOutputs ? r.compoundOutputs[compound.id] : null;

      const y = out ? out.steadyStateConcentration : r.steadyStateConcentration;
      const hq = out ? out.hazardQuotient : r.hazardQuotient;
      const bb = out ? out.peakBodyBurden : r.peakBodyBurden;

      const pt = {
        x: parseFloat(r.dailyIntake.toFixed(4)),
        y: parseFloat(y.toFixed(4)),
        bw: parseFloat(r.bodyWeight.toFixed(1)),
        hq: parseFloat(hq.toFixed(2)),
        bb: parseFloat(bb.toFixed(3)),
      };

      if (hq > 1.0) {
        exceeding.push(pt);
      } else {
        safe.push(pt);
      }
    }

    return { safePoints: safe, exceedingPoints: exceeding, activeCompound: compound };
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
          <RechartsScatterChart margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="Daily Intake"
              unit=" µg/day"
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={25}
              label={{ value: 'Daily PFAS Intake (µg/day)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Serum Concentration"
              unit=" µg/L"
              width={45}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              label={{ value: `${activeCompound.name.split(' ')[0]} Css (µg/L)`, angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <RechartsTooltip
              formatter={(value: unknown, name: unknown) => [`${String(value ?? '')}`, String(name ?? '')]}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isExceeding = data.hq > 1.0;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-lg text-[11px] font-mono space-y-1 shadow-lg border border-slate-700">
                      <div className={`font-bold flex items-center justify-between gap-2 border-b pb-1 ${isExceeding ? 'text-red-400 border-red-800' : 'text-teal-400 border-teal-800'}`}>
                        <span>{activeCompound.name.split(' ')[0]}: {isExceeding ? 'Exceeding (HQ > 1.0)' : 'Safe (HQ ≤ 1.0)'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-white/10 rounded">HQ = {data.hq}</span>
                      </div>
                      <div>Intake: <span className="font-semibold text-blue-300">{data.x} µg/day</span></div>
                      <div>Serum <span className="text-slate-400">Css</span>: <span className="font-semibold text-purple-300">{data.y} µg/L</span></div>
                      <div>Body Burden: <span className="font-semibold text-amber-300">{data.bb} µg</span></div>
                      <div>Body Weight: <span className="text-slate-300">{data.bw} kg</span></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px', paddingTop: '-6px' }} />
            <Scatter name="Safe Cohort (HQ ≤ 1.0)" data={safePoints} fill="#0d9488" opacity={0.65} r={3} />
            <Scatter name="Exceedance Cohort (HQ > 1.0)" data={exceedingPoints} fill="#dc2626" opacity={0.75} r={3.5} />
          </RechartsScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


