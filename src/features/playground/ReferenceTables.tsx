import type React from 'react';
import { MathView } from '../../components/ui/MathView';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import type { ParameterReferenceRow } from './referenceData';

interface ParameterReferenceTableProps {
  rows: ParameterReferenceRow[];
}

/**
 * Source-backed parameter ranges table shared by the guide modal and the
 * scientific guide page.
 */
export const ParameterReferenceTable: React.FC<ParameterReferenceTableProps> = ({ rows }) => (
  <table className="w-full text-left border-collapse text-[11px]">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-mono">
        <th className="p-3 font-semibold">Parameter / Symbol</th>
        <th className="p-3 font-semibold">Unit</th>
        <th className="p-3 font-semibold text-emerald-800 bg-emerald-50/40">Minimum bound</th>
        <th className="p-3 font-semibold text-blue-900 bg-blue-50/50">Baseline / Average</th>
        <th className="p-3 font-semibold text-rose-800 bg-rose-50/40">Upper bound</th>
        <th className="p-3 font-semibold">Recommended distribution</th>
        <th className="p-3 font-semibold">Literature source</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 text-slate-800">
      {rows.map((row) => (
        <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
          <td className="p-3">
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              Symbol: <MathView math={row.symbol} />
            </div>
            <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">
              {row.description}
            </p>
          </td>
          <td className="p-3 font-mono font-medium text-slate-600">{row.unit}</td>
          <td className="p-3 font-mono text-emerald-700 font-medium bg-emerald-50/20">{row.min}</td>
          <td className="p-3 font-mono text-blue-900 font-bold bg-blue-50/30">{row.average}</td>
          <td className="p-3 font-mono text-red-700 font-medium bg-rose-50/20">{row.max}</td>
          <td className="p-3 font-mono text-slate-700 text-[10px]">{row.recommendedDist}</td>
          <td className="p-3 text-slate-500 text-[10px] leading-relaxed max-w-xs">{row.source}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

interface CompoundBenchmarkTableProps {
  cellPadding?: string;
}

/**
 * PFAS regulatory benchmarks. Half-life and distribution volume are omitted
 * because the project source documents do not establish those model inputs.
 */
export const CompoundBenchmarkTable: React.FC<CompoundBenchmarkTableProps> = ({
  cellPadding = 'p-2',
}) => (
  <table className="w-full text-left border-collapse text-[11px]">
    <thead>
      <tr className="border-b border-slate-200 text-slate-600 bg-white font-mono">
        <th className={`${cellPadding} font-semibold`}>Compound</th>
        <th className={`${cellPadding} font-semibold`}>MCL (ng/L)</th>
        <th className={`${cellPadding} font-semibold`}>
          Selected RfD / MRL (<MathView math="\text{RfD}" />; mg/kg/day)
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {PFAS_COMPOUNDS.map((c) => (
        <tr key={c.id} className="hover:bg-slate-100/50">
          <td className={`${cellPadding} font-medium text-slate-900`}>
            {c.name}{' '}
            <span className="text-slate-500 font-mono text-[10px]">(CAS {c.casNumber})</span>
          </td>
          <td className={`${cellPadding} font-mono font-bold text-blue-700`}>{c.epaMCL} ng/L</td>
          <td className={`${cellPadding} font-mono text-slate-700`}>
            <div>{(c.rfdDose / 1000).toExponential()} mg/kg/day</div>
            <div>{c.rfdDose} µg/kg/day</div>
            <div className="text-[9px] text-slate-500 font-sans">{c.rfdSource}</div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
