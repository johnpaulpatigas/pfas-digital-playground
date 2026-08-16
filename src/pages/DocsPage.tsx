import React from 'react';
import { BookOpen, Cpu, ShieldAlert, Layers, CheckCircle, Flame, Users } from 'lucide-react';
import { MathView } from '../components/ui/MathView';

export const DocsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="card-panel p-8 rounded-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific Methodology &amp; Toxicokinetic Equations</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 font-heading">
          Toxicokinetics &amp; Probabilistic Risk Assessment Documentation
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Comprehensive documentation of the mathematical, epidemiological, and physiological models implemented inside the platform.
        </p>
      </div>

      {/* Section 1: Toxicokinetic 1-Compartment Model */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Cpu className="w-5 h-5 text-blue-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">1. One-Compartment Toxicokinetic Model</h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed">
          The 1-compartment pharmacokinetic model assumes rapid distribution throughout systemic blood volume and body tissues, with first-order elimination kinetics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 font-mono text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-blue-900 font-bold text-sm">Elimination Rate Constant (<MathView math="k_e" />)</h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="k_e = \frac{\ln(2)}{T_{1/2} \times 365.25}" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Where <MathView math="T_{1/2}" /> represents biological excretion half-life (years). For PFOA/PFOS, human half-lives average 2.7 to 5.4 years due to renal tubular reabsorption.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-teal-900 font-bold text-sm">Steady State Serum Concentration (<MathView math="C_{ss}" />)</h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="C_{ss} = \frac{I \times f_{abs}}{BW \times V_d \times k_e}" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Where <MathView math="I" /> is daily intake (&micro;g/day), <MathView math="f_{abs}" /> is gastrointestinal bioavailability fraction, <MathView math="BW" /> is body weight (kg), and <MathView math="V_d" /> is volume of distribution (~0.17 L/kg).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5 col-span-1 md:col-span-2">
            <h3 className="text-purple-900 font-bold text-sm">Dynamic Time-Course Serum Concentration (<MathView math="C(t)" />)</h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="C(t) = C_{ss} \left(1 - e^{-k_e \cdot t}\right)" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Models cumulative accumulation over chronic exposure duration <MathView math="t" /> (days), reaching ~95% of steady-state after 4.3 half-lives.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Probability Distributions */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">2. Supported Probability Distributions</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-700 font-sans">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-900 font-mono">Uniform Distribution [a, b]:</span>
            <p className="text-slate-600 leading-relaxed">
              Constant probability density over interval [a, b]. Used when parameter bounds are known but specific central tendencies are unmeasured.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-teal-900 font-mono">Normal Distribution N(&mu;, &sigma;):</span>
            <p className="text-slate-600 leading-relaxed">
              Symmetric Gaussian distribution parameterized by Mean (<MathView math="\mu" />) and Standard Deviation (<MathView math="\sigma" />). Generated using the Box-Muller transform:
              <span className="block pt-1 font-mono text-blue-800">
                <MathView math="Z = \sqrt{-2 \ln(U_1)} \cos(2\pi U_2)" />
              </span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-amber-900 font-mono">Lognormal Distribution LN(&mu;, &sigma;):</span>
            <p className="text-slate-600 leading-relaxed">
              Positively skewed distribution where the logarithm of the random variable is normally distributed:
              <span className="block pt-1 font-mono text-amber-800">
                <MathView math="X = \exp(\mu + Z \cdot \sigma)" />
              </span>
              Highly recommended for environmental contamination levels &amp; daily PFAS intake.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-purple-900 font-mono">Triangular Distribution (a, c, b):</span>
            <p className="text-slate-600 leading-relaxed">
              Defined by Minimum (a), Mode (c), and Maximum (b). Ideal for drinking water consumption estimates based on expert consensus.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Sampling Methods */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Layers className="w-5 h-5 text-purple-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">3. Monte Carlo vs. Latin Hypercube Sampling</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-teal-800 font-bold text-sm font-heading">Monte Carlo Sampling</h3>
            <ul className="space-y-2 text-slate-600 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Pure pseudo-random sampling across parameter probability density functions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Requires larger iteration counts (<MathView math="N \ge 10,000" />) to guarantee distribution convergence.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-purple-800 font-bold text-sm font-heading">Latin Hypercube Sampling (LHS)</h3>
            <ul className="space-y-2 text-slate-600 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>Stratified sampling method dividing cumulative distribution functions into N equal probability strata:</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>Achieves smooth distribution coverage and lower variance with 3x-5x fewer iterations using inverse CDF quantiles: <MathView math="P_k = F^{-1}\left(\frac{k - 1 + U_k}{N}\right)" />.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-blue-800 font-bold text-sm font-heading">Monte Carlo + LHS Hybrid</h3>
            <ul className="space-y-2 text-slate-600 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Ensemble hybrid approach combining 50% Monte Carlo random draws with 50% stratified Latin Hypercube draws.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Captures unconstrained stochastic random variation while maintaining robust quantile stratification across tail risk boundaries (<MathView math="P_{95}" />, <MathView math="P_{99}" />).</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4: Health Risk Assessment & Hazard Quotient */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">4. Probabilistic Human Health Risk Assessment</h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-sans">
          To evaluate toxicological risk, predicted steady-state blood serum concentrations (<MathView math="C_{ss}" />) are compared against health-protective drinking water Maximum Contaminant Levels (MCL) and reference doses (RfD).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-red-900 font-bold text-sm font-heading">Hazard Quotient (HQ) Formula</h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="HQ = \frac{C_{ss}}{\text{Guideline MCL}}" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              An <MathView math="HQ \le 1.0" /> indicates exposures within established toxicological safety thresholds. An <MathView math="HQ > 1.0" /> denotes potential adverse health exceedance.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-rose-900 font-bold text-sm font-heading">Population Exceedance Probability</h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="P(HQ > 1.0) = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(HQ_i > 1.0) \times 100\%" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Quantifies the percentage of the simulated cohort exceeding safe exposure levels, highlighting upper-tail vulnerabilities (<MathView math="P_{95}" />, <MathView math="P_{99}" />).
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Sensitivity Analysis */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Flame className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">5. Global Sensitivity &amp; Parameter Uncertainty</h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-sans">
          Sensitivity analysis quantifies the relative influence of each uncertain input parameter on output serum concentrations. Non-linear monotonic dependencies are modeled using non-parametric <strong>Spearman Rank Correlation</strong>.
        </p>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
          <h3 className="text-amber-900 font-bold text-sm font-heading">Spearman Rank Correlation Coefficient (<MathView math="\rho" />)</h3>
          <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
            <MathView math="\rho = 1 - \frac{6 \sum_{i=1}^N d_i^2}{N(N^2 - 1)}" block />
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
            Where <MathView math="d_i" /> represents the rank difference between parameter input <MathView math="X_i" /> and output serum concentration <MathView math="Y_i" /> for iteration <MathView math="i" />.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-700 font-sans text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <strong className="text-amber-900 font-mono">Positive Drivers (<MathView math="\rho > 0" />):</strong> Daily intake, elimination half-life, and GI absorption increase bioaccumulation.
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <strong className="text-blue-900 font-mono">Protective Drivers (<MathView math="\rho < 0" />):</strong> Body weight dilutes internal serum concentration via increased volume of distribution.
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Scenario Analysis */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Users className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">6. Scenario Analysis &amp; Demographic Profiling</h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-sans">
          The platform evaluates differential risk across demographic and physiological cohorts through validated demographic presets:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-teal-900 font-bold text-sm font-heading">Average Filipino Woman</h3>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Calibrated from Philippine National Nutrition Council (NNC) health surveys: baseline adult body weight of <strong>55.4 kg</strong>, baseline tropical drinking water intake of <strong>2.0 L/day</strong>, and lifetime environmental exposure kinetics.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-purple-900 font-bold text-sm font-heading">Pregnant Female Profile</h3>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Models gestational hemodilution (+40-50% blood plasma volume expansion), increased hydration demands (<strong>2.8 L/day</strong>), gestational mass (<strong>65.2 kg</strong>), and transplacental clearance dynamics shortening maternal serum half-life (<strong>2.4 yrs</strong>).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
