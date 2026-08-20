import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MathView } from '../../components/ui/MathView';
import { Button } from '../../components/ui/Button';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { DEMOGRAPHIC_PRESETS } from '../scenarios/presets';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import {
  X,
  BookOpen,
  Sliders,
  Table as TableIcon,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ParameterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ParameterReferenceRow {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  min: string;
  average: string;
  max: string;
  recommendedDist: string;
  source: string;
  description: string;
  criticalCutoff: string;
}

export const PARAMETER_REFERENCES: ParameterReferenceRow[] = [
  {
    id: 'dailyIntake',
    name: 'Estimated PFAS Daily Intake',
    symbol: 'I',
    unit: 'µg/day',
    min: '0.001 µg/day',
    average: '0.050 – 0.080 µg/day',
    max: '0.250 – 0.500 µg/day',
    recommendedDist: 'Lognormal (µ: 0.05, σ: 0.40) or Triangular',
    source: 'US EPA Exposure Factors Handbook (2019), EFSA Contam Panel (2020)',
    description: 'Total daily aggregate ingested mass of target PFAS from contaminated drinking water, dietary food (seafood/meat/dairy), consumer products, and dust.',
    criticalCutoff: 'I_{crit} = BW × RfD (e.g. 0.0831 µg/day for 55.4 kg with PFOA)',
  },
  {
    id: 'bodyWeight',
    name: 'Body Weight',
    symbol: 'BW',
    unit: 'kg',
    min: '40.0 kg',
    average: '55.4 kg (Filipino Adult Female)',
    max: '85.0 – 100.0 kg',
    recommendedDist: 'Normal (µ: 55.4, σ: 8.5) or Triangular (45, 55, 75)',
    source: 'DOST-FNRI Philippine Dietary Reference Intakes (PDRI), CDC NHANES',
    description: 'Total body mass in kilograms. Lower body weight concentrates analyte mass per kg, shrinking the apparent volume of distribution and accelerating toxicological exceedance.',
    criticalCutoff: 'BW_{crit} = I / RfD (Exceedance occurs when body mass falls below critical cutoff)',
  },
  {
    id: 'age',
    name: 'Age',
    symbol: 'Age',
    unit: 'years',
    min: '18 years',
    average: '30 – 35 years',
    max: '65 – 75 years',
    recommendedDist: 'Uniform (18 – 50) or Normal (µ: 32, σ: 7)',
    source: 'Philippine Statistics Authority (PSA) Reproductive Demographic Cohorts',
    description: 'Subject chronological age, used for cohort stratification and life-stage exposure modeling.',
    criticalCutoff: 'Demographic baseline marker; informs cumulative lifetime exposure duration',
  },
  {
    id: 'waterConsumption',
    name: 'Daily Drinking Water Intake',
    symbol: 'W',
    unit: 'L/day',
    min: '0.8 L/day',
    average: '1.8 – 2.2 L/day',
    max: '3.5 – 5.0 L/day',
    recommendedDist: 'Normal (µ: 2.0, σ: 0.4) or Lognormal (µ: 1.9, σ: 0.3)',
    source: 'WHO Guidelines for Drinking-Water Quality, EPA Exposure Factors Handbook',
    description: 'Direct ingestion volume of tap and municipal drinking water per day. High hydration rates elevate intake when water contains PFAS at or above the EPA Maximum Contaminant Level.',
    criticalCutoff: 'W_{crit} = (BW × RfD) / EPA_MCL (e.g. 20.8 L/day at 4 ng/L for PFOA)',
  },
  {
    id: 'bioavailability',
    name: 'Gastrointestinal Bioavailability',
    symbol: 'f_{abs}',
    unit: 'fraction (0–1)',
    min: '0.75 (75%)',
    average: '0.90 – 0.95 (90–95%)',
    max: '0.99 (99%)',
    recommendedDist: 'Uniform (0.85 – 0.98) or Triangular (0.80, 0.95, 0.99)',
    source: 'ATSDR Toxicological Profile for Perfluoroalkyls (2021)',
    description: 'Fraction of ingested PFAS that is absorbed through the gastrointestinal tract directly into systemic blood circulation. PFAS carboxylic and sulfonic acids exhibit near-complete GI absorption.',
    criticalCutoff: 'f_{abs, crit} = (BW × RfD) / I (Fraction required to breach safe absorbed daily dose)',
  },
  {
    id: 'eliminationHalfLife',
    name: 'Elimination Half-Life',
    symbol: 'T_{1/2}',
    unit: 'years',
    min: '0.1 yr (GenX)',
    average: '3.8 yr (PFOA), 5.4 yr (PFOS), 8.5 yr (PFHxS)',
    max: '12.0 yr (PFHxS upper bound)',
    recommendedDist: 'Fixed or Normal around target compound human empirical mean',
    source: 'Olsen et al. (2007), Li et al. (2018), US EPA Health Advisory Reviews',
    description: 'Biological half-life for renal and biliary clearance in human blood serum. Long-chain PFAS undergo extensive renal tubular reabsorption via organic anion transporters (OAT4, URAT1).',
    criticalCutoff: 'T_{1/2, crit} = (BW × RfD / I) × T_{1/2} (Prolonged half-life elevates steady-state mass)',
  },
  {
    id: 'exposureDuration',
    name: 'Exposure Duration',
    symbol: 't',
    unit: 'years',
    min: '1.0 year',
    average: '25 – 30 years (Chronic Steady-State Plateau)',
    max: '40 – 50 years (Lifetime)',
    recommendedDist: 'Uniform (25 – 30) for baseline average, or Fixed (30)',
    source: 'US EPA Superfund Standard Default Exposure Factors (30-yr residential)',
    description: 'Continuous exposure timespan. Because PFAS half-lives span 3 to 8 years, 25 to 30 years corresponds to 5 to 8 half-lives, achieving >99% of theoretical steady-state equilibrium capacity.',
    criticalCutoff: 't \\ge 25\\text{–}30\\text{ years}: \\text{Achieves } (1 - e^{-k_e t}) \\ge 0.99 \\text{ of steady state}',
  },
];

export const ParameterGuideModal: React.FC<ParameterGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ranges' | 'workflow' | 'presets'>('ranges');
  const [searchQuery, setSearchQuery] = useState('');
  const { loadScenario } = useSimulationStore();

  if (!isOpen) return null;

  const filteredParams = PARAMETER_REFERENCES.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.symbol.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                PFAS Simulation Playground: Parameter &amp; Usage Guide
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Physiological ranges, recommended probability distributions, and step-by-step modeling guide.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-white font-mono text-xs">
          <button
            onClick={() => setActiveTab('ranges')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ranges'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Parameter Ranges (Min / Avg / Max)</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>How to Use the Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demographic Cohort Presets</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs font-sans">
          {/* TAB 1: PARAMETER RANGES */}
          {activeTab === 'ranges' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Filter parameters by name, unit, or literature source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-500 font-mono text-[11px] shrink-0">
                  Showing {filteredParams.length} of {PARAMETER_REFERENCES.length} parameters
                </span>
              </div>

              {/* Reference Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-mono">
                      <th className="p-3 font-semibold">Parameter / Symbol</th>
                      <th className="p-3 font-semibold">Unit</th>
                      <th className="p-3 font-semibold text-emerald-800 bg-emerald-50/40">Minimum Bound</th>
                      <th className="p-3 font-semibold text-blue-900 bg-blue-50/50">Baseline / Average</th>
                      <th className="p-3 font-semibold text-rose-800 bg-rose-50/40">Upper / Max Bound</th>
                      <th className="p-3 font-semibold">Recommended Distribution</th>
                      <th className="p-3 font-semibold">Literature Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredParams.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Symbol: <MathView math={row.symbol} /></div>
                          <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">{row.description}</p>
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
              </div>

              {/* Target PFAS Compound Pharmacokinetic Reference */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs font-heading">
                    Target PFAS Compounds &amp; Regulatory Benchmark Table
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">US EPA NPDWR (2024) Benchmarks</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 bg-white font-mono">
                        <th className="p-2 font-semibold">Compound</th>
                        <th className="p-2 font-semibold">Half-Life (<MathView math="T_{1/2}" />)</th>
                        <th className="p-2 font-semibold">Volume of Distribution (<MathView math="V_d" />)</th>
                        <th className="p-2 font-semibold">EPA MCL (ng/L)</th>
                        <th className="p-2 font-semibold">Reference Dose (<MathView math="\text{RfD}" />)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {PFAS_COMPOUNDS.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-100/50">
                          <td className="p-2 font-medium text-slate-900">
                            {c.name} <span className="text-slate-500 font-mono text-[10px]">(CAS {c.casNumber})</span>
                          </td>
                          <td className="p-2 font-mono">{c.halfLifeYears} years</td>
                          <td className="p-2 font-mono">{c.volumeOfDistribution} L/kg</td>
                          <td className="p-2 font-mono font-bold text-blue-700">{c.epaMCL} ng/L</td>
                          <td className="p-2 font-mono text-slate-700">{c.rfdDose} µg/kg/day</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP PLAYGROUND WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                <div className="font-bold text-blue-950 text-xs font-heading">
                  Quick-Start 4-Step Simulation Workflow
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The PFAS Digital Playground executes high-throughput probabilistic 1-compartment toxicokinetic simulations. Follow these four steps to run custom demographic cohort analyses:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                {/* Step 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">1</span>
                    <span className="font-bold text-slate-900 text-xs font-heading">Select Compound &amp; Physiological Cohort</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Choose a target chemical from the top sidebar dropdown (e.g. <strong>PFOA</strong>, <strong>PFOS</strong>, <strong>PFHxS</strong>, <strong>PFNA</strong>, or <strong>GenX</strong>). Each compound automatically loads its peer-reviewed biological half-life, volume of distribution, and US EPA Maximum Contaminant Level (MCL).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">2</span>
                    <span className="font-bold text-slate-900 text-xs font-heading">Configure Parameter Distributions</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Choose from 5 statistical distribution types for each physiological variable:
                  </p>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside font-mono">
                    <li><strong>Fixed:</strong> Deterministic single-value point estimate.</li>
                    <li><strong>Uniform [min, max]:</strong> Equal probability across a bounded range.</li>
                    <li><strong>Normal (µ, σ):</strong> Symmetric bell-curve distribution.</li>
                    <li><strong>Lognormal (µ, σ):</strong> Right-skewed environmental distribution (best for daily intake).</li>
                    <li><strong>Triangular (min, mode, max):</strong> Expert-estimated three-point distribution.</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">3</span>
                    <span className="font-bold text-slate-900 text-xs font-heading">Select Sampling Engine &amp; Iteration Size</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Select your preferred probabilistic sampling engine:
                  </p>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside">
                    <li><strong>Monte Carlo:</strong> Pure pseudo-random sampling across multi-dimensional parameter space.</li>
                    <li><strong>Latin Hypercube (LHS):</strong> Stratified orthogonal sampling guaranteeing stratified coverage of tail vulnerabilities.</li>
                    <li><strong>MC + LHS Hybrid:</strong> Blended execution for optimal variance reduction and convergence speed.</li>
                  </ul>
                  <p className="text-[10px] text-slate-500">Recommended Sample Size: <strong>N = 2,000 to 10,000 iterations</strong>.</p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">4</span>
                    <span className="font-bold text-slate-900 text-xs font-heading">Execute &amp; Interpret Output Tabs</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Click <strong>&quot;Execute Simulation&quot;</strong> and inspect the 8 analytical playground tabs:
                  </p>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside">
                    <li><strong>Critical Thresholds:</strong> Parameter limits where Hazard Quotient <MathView math="HQ = 1.0" />.</li>
                    <li><strong>Histogram &amp; CDF:</strong> Population serum concentration density and tail percentiles (<MathView math="P_{95}" />, <MathView math="P_{99}" />).</li>
                    <li><strong>Time-Course Kinetics:</strong> Dynamic multi-year bioaccumulation curves up to 40 years.</li>
                    <li><strong>Tornado Sensitivity:</strong> Spearman rank correlation (<MathView math="\rho" />) identifying primary exposure drivers.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEMOGRAPHIC PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 text-[11px]">
                  Select any pre-configured population scenario to inspect its parameter distributions and quickly load it into the playground:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DEMOGRAPHIC_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs font-heading">{preset.name}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-semibold">
                          {preset.targetGroup}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-500">
                        Intake: {preset.parameters.dailyIntake.distribution.type} • BW: {preset.parameters.bodyWeight.distribution.type}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          loadScenario(preset.id);
                          onClose();
                        }}
                        className="text-[10px] font-mono shrink-0"
                      >
                        Load Scenario
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>Need deeper toxicological background?</span>
            <Link
              to="/guide"
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 flex items-center gap-0.5"
            >
              <span>Explore the full Scientific Guide</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/docs" onClick={onClose}>
              <Button variant="secondary" size="sm">
                Mathematical Docs
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
