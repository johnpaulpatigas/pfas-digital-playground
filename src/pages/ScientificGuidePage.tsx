import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Flame,
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';
import { MathView } from '../components/ui/MathView';
import { Button } from '../components/ui/Button';

export const ScientificGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'risk' | 'sensitivity' | 'scenario'>('risk');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="card-panel p-6 sm:p-10 rounded-3xl space-y-4 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-medium">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Toxicokinetics &amp; Risk Science Guide</span>
          </div>

          <Link to="/playground">
            <Button
              variant="secondary"
              size="sm"
              icon={<Activity className="w-3.5 h-3.5 text-blue-600" />}
            >
              Open Simulation Playground
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            Scientific Guide: Risk, Sensitivity &amp; Scenario Analysis
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl font-sans">
            A comprehensive reference on the toxicological theory, mathematical formulation, and epidemiological applications of probabilistic PFAS exposure modeling in Filipino female cohorts.
          </p>
        </div>

        {/* Quick Topics Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setActiveTab('risk')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'risk'
                ? 'bg-red-50/80 border-red-300 ring-2 ring-red-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-red-700 font-bold font-heading text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>Risk Assessment</span>
            </div>
            <p className="text-slate-600 text-xs mt-1 font-sans">
              Hazard Quotient (HQ), MCL thresholds &amp; population tail risk (<MathView math="P_{95}" />, <MathView math="P_{99}" />).
            </p>
          </button>

          <button
            onClick={() => setActiveTab('sensitivity')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'sensitivity'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-amber-700 font-bold font-heading text-sm">
              <Flame className="w-4 h-4" />
              <span>Sensitivity Analysis</span>
            </div>
            <p className="text-slate-600 text-xs mt-1 font-sans">
              Spearman Rank (<MathView math="\rho" />), tornado rankings, and key exposure drivers.
            </p>
          </button>

          <button
            onClick={() => setActiveTab('scenario')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'scenario'
                ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-teal-700 font-bold font-heading text-sm">
              <Users className="w-4 h-4" />
              <span>Scenario Analysis</span>
            </div>
            <p className="text-slate-600 text-xs mt-1 font-sans">
              Baseline female cohorts vs. gestational hemodilution &amp; transplacental kinetics.
            </p>
          </button>
        </div>
      </div>

      {/* Main Guide Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* TAB 1: HEALTH RISK ASSESSMENT */}
        {/* ========================================================================= */}
        {activeTab === 'risk' && (
          <motion.div
            key="risk-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Core Section: Hazard Quotient */}
            <section className="card-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                    1. Probabilistic Human Health Risk Assessment &amp; Hazard Quotient (HQ)
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Quantifying exposure exceedance against established regulatory and toxicological safety standards.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 font-sans leading-relaxed text-sm sm:text-base">
                <p>
                  Traditional deterministic risk assessments multiply single fixed point estimates (e.g., average body weight and median drinking water intake). 
                  This creates a critical flaw: <strong>it conceals the upper tail of the population distribution</strong>, where individuals with low body weights, high drinking water volumes, or prolonged excretion half-lives face elevated health risks.
                </p>
                <p>
                  Our probabilistic approach couples Monte Carlo and Latin Hypercube sampling with a 1-compartment toxicokinetic model to generate full empirical risk distributions, enabling precise quantification of median burden (<MathView math="P_{50}" />) and high-risk percentiles (<MathView math="P_{95}" />, <MathView math="P_{99}" />).
                </p>
              </div>

              {/* Mathematical Equations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm font-heading">Hazard Quotient (HQ)</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">Equation 1</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-300 text-center font-bold text-base">
                    <MathView math="HQ = \frac{C_{ss}}{\text{Guideline MCL}}" block />
                  </div>
                  <p className="text-slate-600 text-xs font-sans leading-relaxed">
                    Ratio of predicted steady-state blood serum concentration (<MathView math="C_{ss}" />) to the compound-specific Maximum Contaminant Level (MCL) or health reference concentration.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm font-heading">Population Exceedance Fraction</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">Equation 2</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-300 text-center font-bold text-base">
                    <MathView math="P(HQ > 1.0) = \frac{1}{N}\sum_{i=1}^N \mathbb{I}(HQ_i > 1.0) \times 100\%" block />
                  </div>
                  <p className="text-slate-600 text-xs font-sans leading-relaxed">
                    The proportion of sampled iterations where predicted internal body burden exceeds the toxicological threshold of safety (<MathView math="HQ > 1.0" />).
                  </p>
                </div>
              </div>

              {/* Decision Benchmark Table */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 font-heading text-sm">
                  Hazard Quotient (HQ) Decision Benchmark Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold font-mono text-emerald-900">HQ &le; 1.0 — Acceptable / Low Concern</span>
                    </div>
                    <p className="text-emerald-800 leading-relaxed text-[11px]">
                      The predicted steady-state serum level is within the non-cancer toxicological safety threshold. No adverse health effect is anticipated under chronic exposure conditions.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span className="font-bold font-mono text-rose-900">HQ &gt; 1.0 — Elevated Risk Threshold</span>
                    </div>
                    <p className="text-rose-800 leading-relaxed text-[11px]">
                      Predicted exposure exceeds the health benchmark. Warrants immediate public health intervention, point-of-use water filtration, and epidemiological biomonitoring.
                    </p>
                  </div>
                </div>
              </div>

              {/* Regulatory Benchmarks & Health Effects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 font-heading text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Regulatory Drinking Water Standards</span>
                  </h3>
                  <div className="space-y-2 text-xs font-sans text-slate-600 leading-relaxed">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 font-mono block">US EPA NPDWR (2024):</strong>
                      Legally enforceable Maximum Contaminant Levels of <strong>4.0 ng/L (ppt)</strong> for PFOA and PFOS, and <strong>10.0 ng/L</strong> for PFNA, PFHxS, and GenX (HFPO-DA).
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 font-mono block">European Food Safety Authority (EFSA):</strong>
                      Group Tolerable Weekly Intake (TWI) of <strong>4.4 ng/kg body weight/week</strong> for the sum of four legacy PFAS (PFOA, PFOS, PFNA, PFHxS).
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 font-heading text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>How to Evaluate Risk in the Playground</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700 font-sans">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span>
                        <strong>Examine the CDF Tab:</strong> The Cumulative Distribution Function (CDF) chart displays a vertical reference line indicating where the population exceeds <MathView math="HQ = 1.0" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span>
                        <strong>Monitor the 95th Percentile (<MathView math="P_{95}" />):</strong> In many scenarios, the median (<MathView math="P_{50}" />) may show safe levels while the upper 5% of the population faces severe exceedances.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span>
                        <strong>Compound Comparison:</strong> Switch compounds in the sidebar to observe how shorter chain chemicals (GenX) vs legacy long-chain acids (PFOS) differ in serum retention.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SENSITIVITY ANALYSIS */}
        {/* ========================================================================= */}
        {activeTab === 'sensitivity' && (
          <motion.div
            key="sensitivity-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <section className="card-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                    2. Global Sensitivity Analysis &amp; Spearman Rank Correlation (<MathView math="\rho" />)
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Uncovering the dominant exposure drivers and physiological determinants of internal serum accumulation.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 font-sans leading-relaxed text-sm sm:text-base">
                <p>
                  Toxicokinetic models are inherently non-linear. To identify which parameter uncertainties drive the most variance in predicted steady-state blood serum concentrations (<MathView math="C_{ss}" />), the platform computes non-parametric <strong>Spearman Rank Correlation Coefficients</strong> (<MathView math="\rho" />).
                </p>
                <p>
                  Rank correlation assesses monotonic relationships between inputs and outputs without assuming strict linearity or normal error structures, making it the gold standard for global sensitivity analysis in computational toxicology.
                </p>
              </div>

              {/* Spearman Formula Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm font-heading">Spearman Rank Correlation Formula</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Equation 3</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-300 text-center font-bold text-base">
                  <MathView math="\rho = 1 - \frac{6 \sum_{i=1}^N d_i^2}{N(N^2 - 1)}" block />
                </div>
                <p className="text-slate-600 text-xs font-sans leading-relaxed">
                  Where <MathView math="d_i = \text{rank}(X_i) - \text{rank}(Y_i)" /> represents the difference in rank between the input parameter <MathView math="X" /> and resulting serum concentration <MathView math="Y" /> across <MathView math="N" /> stochastic iterations.
                </p>
              </div>

              {/* Directionality & Tornado Interpretation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
                  <span className="font-bold font-mono text-amber-900 text-sm block">
                    Positive Correlation (<MathView math="\rho > 0" />) — Direct Exposure Drivers
                  </span>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    Higher values lead directly to higher internal serum accumulation:
                  </p>
                  <ul className="space-y-1.5 text-amber-900 text-[11px] list-disc list-inside">
                    <li><strong>Daily Intake (<MathView math="I" />):</strong> Usually the strongest driver (<MathView math="\rho \approx +0.75 \text{ to } +0.90" />).</li>
                    <li><strong>Elimination Half-Life (<MathView math="T_{1/2}" />):</strong> Slower renal clearance leads to longer internal residence.</li>
                    <li><strong>Bioavailability (<MathView math="f_{abs}" />):</strong> Greater gastrointestinal uptake elevates systemic circulation.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-2">
                  <span className="font-bold font-mono text-blue-900 text-sm block">
                    Negative Correlation (<MathView math="\rho < 0" />) — Inverting / Protective Factors
                  </span>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    Higher values reduce steady-state blood serum concentration:
                  </p>
                  <ul className="space-y-1.5 text-blue-900 text-[11px] list-disc list-inside">
                    <li><strong>Body Weight (<MathView math="BW" />):</strong> Expands total volume of distribution (<MathView math="V_d \cdot BW" />), diluting serum levels (<MathView math="\rho \approx -0.40 \text{ to } -0.60" />).</li>
                    <li><strong>Renal Clearance Rate:</strong> Faster elimination reduces the steady-state plateau.</li>
                  </ul>
                </div>
              </div>

              {/* Public Health & Mitigation Relevance */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-sans text-xs">
                <h3 className="font-bold text-slate-900 font-heading text-sm">
                  Translating Sensitivity Findings to Public Health Action
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Sensitivity analysis directs where public health funding and regulatory actions should be allocated:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-mono text-xs block">1. Water Remediation</strong>
                    <p className="text-slate-600 text-[11px]">
                      If Daily Intake is the primary driver, investing in activated carbon or ion exchange water treatment creates the steepest drop in population serum levels.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-mono text-xs block">2. Target Vulnerable Cohorts</strong>
                    <p className="text-slate-600 text-[11px]">
                      Because Body Weight has negative sensitivity, lower-weight demographics (such as adolescent females or low-BMI cohorts) require tailored safety factors.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-mono text-xs block">3. Dietary Advisories</strong>
                    <p className="text-slate-600 text-[11px]">
                      Guides local food safety authorities on issuing specific guidelines on high-accumulation marine products and food packaging.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCENARIO ANALYSIS */}
        {/* ========================================================================= */}
        {activeTab === 'scenario' && (
          <motion.div
            key="scenario-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <section className="card-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                    3. Demographic Scenario Analysis &amp; Maternal Physiological Adaptations
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Evaluating physiological variability across general adult female and maternal gestational cohorts in the Philippines.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 font-sans leading-relaxed text-sm sm:text-base">
                <p>
                  Exposure risks and toxicokinetics differ substantially across demographic cohorts and distinct biological life stages. 
                  The platform provides calibrated physiological presets tailored specifically for Filipino female populations.
                </p>
              </div>

              {/* Cohort Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                {/* Cohort 1 */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 font-heading text-sm">
                        Average Filipino Woman
                      </h3>
                      <span className="text-[11px] text-slate-500 font-mono">General Adult Female Cohort</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-teal-100 text-teal-800 font-mono font-bold text-[10px]">
                      Baseline
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-xs">
                    Baseline physiological parameters parameterized from Philippine National Nutrition Council (NNC) national surveys and tropical hydration studies:
                  </p>

                  <div className="space-y-2 font-mono text-[11px] text-slate-800">
                    <div className="flex justify-between p-2 rounded bg-white border border-slate-200">
                      <span>Body Weight:</span>
                      <strong>Mean 55.4 kg (SD: 8.2 kg)</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-slate-200">
                      <span>Daily Drinking Water:</span>
                      <strong>Mode 2.0 L/day (1.2 - 3.5 L)</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-slate-200">
                      <span>Age Span:</span>
                      <strong>18 - 45 years</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-slate-200">
                      <span>Elimination Half-Life:</span>
                      <strong>Mean 3.2 yrs (PFOA/PFOS)</strong>
                    </div>
                  </div>
                </div>

                {/* Cohort 2 */}
                <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                    <div>
                      <h3 className="font-bold text-purple-950 font-heading text-sm">
                        Pregnant Female Profile
                      </h3>
                      <span className="text-[11px] text-purple-700 font-mono">Maternal Physiology Cohort</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-mono font-bold text-[10px]">
                      Maternal
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-xs">
                    Adjusted for critical physiological adaptations occurring during human gestation:
                  </p>

                  <div className="space-y-2 font-mono text-[11px] text-purple-950">
                    <div className="flex justify-between p-2 rounded bg-white border border-purple-200">
                      <span>Gestational Mass:</span>
                      <strong>Mean 65.2 kg (+10 to 15 kg gain)</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-purple-200">
                      <span>Hydration Demand:</span>
                      <strong>Mode 2.8 L/day (2.0 - 4.5 L)</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-purple-200">
                      <span>Hemodilution:</span>
                      <strong>+40-50% Blood Plasma Expansion</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-purple-200">
                      <span>Apparent Half-Life:</span>
                      <strong>Mean 2.4 yrs (Transplacental clearance)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crucial Toxicokinetic Note */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 font-sans text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold font-mono text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-700" />
                  <span>Crucial Toxicokinetic Note on Maternal Serum Levels</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  During pregnancy, maternal blood serum PFAS concentrations often appear lower than non-pregnant baselines. 
                  This is caused by <strong>hemodilution</strong> (expanded blood plasma volume diluting analyte concentration) and <strong>transplacental transfer</strong> into fetal cord blood. 
                  Lower serum readings do not indicate reduced chemical burden, but rather distribution into the developing fetus.
                </p>
              </div>

              {/* What-If Testing Guide */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-sans text-xs">
                <h3 className="font-bold text-slate-900 font-heading text-sm">
                  Conducting What-If Scenario Simulations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-mono text-xs block">1. Preset Swapping</strong>
                    <p className="text-slate-600 text-[11px]">
                      Swap between Average Filipino Woman and Pregnant Female in the playground sidebar to observe the immediate shift in steady-state concentration (<MathView math="C_{ss}" />) and Hazard Quotient (<MathView math="HQ" />).
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-mono text-xs block">2. Distribution Alteration</strong>
                    <p className="text-slate-600 text-[11px]">
                      Change Daily Intake distribution parameters to simulate water filtration interventions or municipal clean water deployment.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-mono text-xs block">3. Method Benchmark</strong>
                    <p className="text-slate-600 text-[11px]">
                      Use the <em>MC vs LHS Compare</em> page to benchmark how Latin Hypercube Sampling achieves lower variance with fewer iterations across these cohorts.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA Card */}
      <div className="card-panel p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white font-heading">
            Ready to test these scientific models in real-time?
          </h3>
          <p className="text-xs text-slate-300 font-sans">
            Configure exposure distributions, run Monte Carlo &amp; LHS sampling, and visualize your results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/playground">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Open Simulation Playground
            </Button>
          </Link>
          <Link to="/compare">
            <Button
              variant="secondary"
              size="md"
              icon={<Layers className="w-4 h-4" />}
            >
              Compare MC vs LHS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
