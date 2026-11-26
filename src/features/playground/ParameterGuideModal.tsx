import { ArrowRight, BookOpen, Sliders, Sparkles, Table as TableIcon, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { MathView } from '../../components/ui/MathView';
import { getSimulationParameter } from '../../simulation/parameters';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { DEMOGRAPHIC_PRESETS } from '../scenarios/presets';
import { CompoundBenchmarkTable, ParameterReferenceTable } from './ReferenceTables';
import { PARAMETER_REFERENCES } from './referenceData';

interface ParameterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParameterGuideModal: React.FC<ParameterGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ranges' | 'workflow' | 'presets'>('ranges');
  const [searchQuery, setSearchQuery] = useState('');
  const loadScenario = useSimulationStore((state) => state.loadScenario);

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
                PFAS simulation: parameter and usage guide
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Physiological ranges, recommended distributions, and simulation steps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close guide"
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
            <span>Parameter ranges (min, avg, max)</span>
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
            <span>How to use the playground</span>
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
            <span>Demographic cohort presets</span>
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
                <ParameterReferenceTable rows={filteredParams} />
              </div>

              {/* Target PFAS Compound Pharmacokinetic Reference */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs font-heading">
                    Target PFAS compounds and regulatory benchmarks
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    US EPA NPDWR (2024) benchmarks
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <CompoundBenchmarkTable />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP PLAYGROUND WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                <div className="font-bold text-blue-950 text-xs font-heading">
                  4-step simulation workflow
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Follow these four steps to configure parameters and run toxicokinetic simulations:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                {/* Step 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">
                      1
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-heading">
                      Select chemical and cohort
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Choose a target chemical from the top sidebar dropdown (such as{' '}
                    <strong>PFOA</strong>, <strong>PFOS</strong>, <strong>PFHxS</strong>,{' '}
                    <strong>PFNA</strong>, or <strong>GenX</strong>). Each compound loads its
                    biological half-life, volume of distribution, and US EPA Maximum Contaminant
                    Level (MCL).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-heading">
                      Configure parameter distributions
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Choose from five statistical distribution types for each physiological variable:
                  </p>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside font-mono">
                    <li>Fixed: Deterministic single-value point estimate.</li>
                    <li>Uniform [min, max]: Equal probability across a bounded range.</li>
                    <li>Normal (µ, σ): Symmetric bell-curve distribution.</li>
                    <li>
                      Lognormal (µ, σ): Right-skewed distribution (standard for daily intake).
                    </li>
                    <li>
                      Triangular (min, mode, max): Three-point distribution based on expert bounds.
                    </li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">
                      3
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-heading">
                      Select sampling method and sample size
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Select a sampling engine:
                  </p>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Monte Carlo: Pseudo-random sampling across parameter ranges.</li>
                    <li>
                      Latin hypercube (LHS): Stratified sampling with uniform distribution coverage.
                    </li>
                    <li>
                      MC + LHS hybrid: Blended execution for variance reduction and sample
                      stability.
                    </li>
                  </ul>
                  <p className="text-[10px] text-slate-500">
                    Recommended sample size: N = 2,000 to 10,000 iterations.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center">
                      4
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-heading">
                      Execute and inspect output tabs
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Click <strong>&quot;Execute Simulation&quot;</strong> and view the analytical
                    tabs:
                  </p>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>
                      Critical thresholds: Parameter limits where Hazard Quotient{' '}
                      <MathView math="HQ = 1.0" /> and exploratory HQ sum = 1.0 (not a regulatory
                      mixture threshold).
                    </li>
                    <li>
                      Histogram and CDF: Population serum concentration density and tail percentiles
                      (<MathView math="P_{95}" />, <MathView math="P_{99}" />
                      ).
                    </li>
                    <li>
                      Time-course kinetics: Dynamic multi-year bioaccumulation curves up to 40
                      years.
                    </li>
                    <li>
                      Tornado sensitivity: Spearman rank correlation (<MathView math="\rho" />)
                      showing which inputs drive exposure.
                    </li>
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
                  Select a pre-configured population scenario to inspect its parameter distributions
                  or load it into the playground:
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
                        <span className="font-bold text-slate-900 text-xs font-heading">
                          {preset.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-semibold">
                          {preset.targetGroup}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-500">
                        Intake:{' '}
                        {
                          getSimulationParameter(preset.parameters, 'dailyIntakePfoa').distribution
                            .type
                        }{' '}
                        • BW: {preset.parameters.bodyWeight.distribution.type}
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
                        Load scenario
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
            <span>For more toxicological background:</span>
            <Link
              to="/guide"
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 flex items-center gap-0.5"
            >
              <span>Read the full scientific guide</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/docs" onClick={onClose}>
              <Button variant="secondary" size="sm">
                Mathematical docs
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
