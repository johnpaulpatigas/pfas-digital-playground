import { BookOpen, CheckCircle, Cpu, Flame, Layers, ShieldAlert, Users } from 'lucide-react';
import type React from 'react';
import { MathView } from '../components/ui/MathView';

export const DocsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="card-panel p-8 rounded-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific methodology and equations</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 font-heading">
          Toxicokinetics and probabilistic risk assessment documentation
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Mathematical, physiological, and exposure models implemented in the simulation tool.
        </p>
      </div>

      {/* Section 1: Toxicokinetic 1-Compartment Model */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Cpu className="w-5 h-5 text-blue-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            1. One-compartment toxicokinetic model
          </h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed">
          The 1-compartment model assumes uniform distribution throughout systemic blood volume and
          tissues, with first-order elimination.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 font-mono text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-blue-900 font-bold text-sm">
              Elimination rate constant (<MathView math="k_e" />)
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="k_e = \frac{\ln(2)}{T_{1/2} \times 365.25}" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Where <MathView math="T_{1/2}" /> is a model input for biological elimination
              half-life in years. The June 2024 Ecology memo reports DOH applied a 3.52-year PFNA
              estimate from Yu et al. (2021) in its modified MRL derivation. Comparable values for
              the other modeled compounds are not provided; treat those as model assumptions and set
              them for the study being modeled.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-teal-900 font-bold text-sm">
              Steady-state serum concentration (<MathView math="C_{ss}" />)
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="C_{ss} = \frac{I \times f_{abs}}{BW \times V_d \times k_e}" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Total daily intake is calculated per compound as non-water intake plus water-derived
              intake (<MathView math="I_j = I_{nw,j} + C_{w,j} W / 1000" />, where{' '}
              <MathView math="C_{w,j}" /> is in ng/L and <MathView math="W" /> is in L/day).{' '}
              <MathView math="I" /> is total intake (&micro;g/day), <MathView math="f_{abs}" /> is
              the gastrointestinal absorption fraction, <MathView math="BW" /> is body weight in kg,
              and <MathView math="V_d" /> is volume of distribution. The project source documents do
              not provide a volume of distribution; this remains an explicit model assumption.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5 col-span-1 md:col-span-2">
            <h3 className="text-purple-900 font-bold text-sm">
              Dynamic time-course serum concentration (<MathView math="C(t)" />)
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="C(t) = C_{ss} \left(1 - e^{-k_e \cdot t}\right)" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Models cumulative accumulation over exposure duration <MathView math="t" /> in days,
              reaching approximately 95% of steady state after 4.3 half-lives.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Probability Distributions */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            2. Supported probability distributions
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-700 font-sans">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-900 font-mono">Uniform distribution [a, b]:</span>
            <p className="text-slate-600 leading-relaxed">
              Constant probability density over interval [a, b]. Used when parameter bounds are
              known but central tendency data is limited.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-teal-900 font-mono">
              Normal distribution N(&mu;, &sigma;):
            </span>
            <p className="text-slate-600 leading-relaxed">
              Symmetric Gaussian distribution defined by mean (<MathView math="\mu" />) and standard
              deviation (<MathView math="\sigma" />
              ). The simulator uses the Box-Muller transform:
              <span className="block pt-1 font-mono text-blue-800">
                <MathView math="Z = \sqrt{-2 \ln(U_1)} \cos(2\pi U_2)" />
              </span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-amber-900 font-mono">
              Lognormal distribution LN(&mu;, &sigma;):
            </span>
            <p className="text-slate-600 leading-relaxed">
              Right-skewed distribution where the natural log of the variable is normally
              distributed:
              <span className="block pt-1 font-mono text-amber-800">
                <MathView math="X = \exp(\mu + Z \cdot \sigma)" />
              </span>
              Standard choice for environmental contamination concentrations and daily intake rates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-purple-900 font-mono">
              Triangular distribution (a, c, b):
            </span>
            <p className="text-slate-600 leading-relaxed">
              Defined by minimum (a), mode (c), and maximum (b). Useful for drinking water
              consumption estimates where minimum, typical, and maximum intake bounds are reported.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Sampling Methods */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Layers className="w-5 h-5 text-purple-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            3. Monte Carlo and Latin hypercube sampling
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-teal-800 font-bold text-sm font-heading">Monte Carlo sampling</h3>
            <ul className="space-y-2 text-slate-600 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Pseudo-random sampling across parameter probability density functions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>
                  Requires larger sample sizes (<MathView math="N \ge 10,000" />) to achieve stable
                  quantile estimates.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-purple-800 font-bold text-sm font-heading">
              Latin hypercube sampling (LHS)
            </h3>
            <ul className="space-y-2 text-slate-600 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>
                  Stratified sampling method dividing cumulative distribution functions into N equal
                  probability strata:
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>
                  Produces uniform parameter space coverage and lower sample variance with fewer
                  iterations: <MathView math="P_k = F^{-1}\left(\frac{k - 1 + U_k}{N}\right)" />.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-blue-800 font-bold text-sm font-heading">
              Monte Carlo + LHS hybrid
            </h3>
            <ul className="space-y-2 text-slate-600 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Combines 50% Monte Carlo random draws with 50% stratified Latin hypercube draws.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Maintains random variation across the sample while ensuring coverage of upper-tail
                  percentiles (<MathView math="P_{95}" />, <MathView math="P_{99}" />
                  ).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Offloads sampling computations to a background Web Worker so the main browser
                  thread stays responsive.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3.1: Population Quantiles and Variance Metrics */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-heading">
            Population quantiles and variance metrics
          </h3>
          <p className="text-slate-600 text-xs font-sans leading-relaxed">
            Probabilistic exposure modeling yields continuous output distributions for steady-state
            serum concentration (<MathView math="C_{ss}" />) and internal body burden. Because human
            exposure data is typically right-skewed (lognormally distributed), non-parametric
            population quantiles and variance metrics are essential to avoid biased conclusions from
            arithmetic means alone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Quantiles Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-teal-900 text-sm font-heading block">
                Population Quantiles (<MathView math="P_k" />)
              </span>
              <p className="text-slate-600 text-[11px] font-sans leading-relaxed">
                Calculated by sorting simulated iteration outputs (
                <MathView math="x_{(1)} \le x_{(2)} \le \dots \le x_{(N)}" />) and interpolating the
                empirical cumulative distribution function <MathView math="P_k = F^{-1}(k/100)" />:
              </p>
              <ul className="space-y-1.5 text-[11px] text-slate-700 font-sans">
                <li>
                  <strong>P5 (5th Percentile):</strong> Lower baseline exposure; 95% of the modeled
                  cohort accumulates concentrations exceeding this level.
                </li>
                <li>
                  <strong>P25 & P75 (Quartiles / IQR):</strong> The interquartile range [
                  <MathView math="P_{25}, P_{75}" />] spans the middle 50% of the population without
                  being pulled by extreme values.
                </li>
                <li>
                  <strong>P50 (Median):</strong> Non-parametric central tendency, representing
                  typical exposure without distortion from high-dose right-skewed tails.
                </li>
                <li>
                  <strong>P95 (95th Percentile):</strong> Regulatory high-exposure benchmark (US EPA
                  / EFSA), representing sensitive or highly exposed subgroups (e.g., high fluid
                  consumers).
                </li>
                <li>
                  <strong>P99 (Extreme Tail):</strong> Captures worst-case susceptibility where
                  lower body weight, elevated intake, and slower excretion coincide.
                </li>
              </ul>
            </div>

            {/* Variance Metrics Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-purple-900 text-sm font-heading block">
                Variance & Dispersion Metrics (<MathView math="\sigma, \sigma^2, CV" />)
              </span>
              <p className="text-slate-600 text-[11px] font-sans leading-relaxed">
                Quantifies the magnitude of statistical dispersion and parametric uncertainty
                propagated from physiological inputs into internal dose metrics:
              </p>
              <div className="text-slate-900 bg-white p-2.5 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs space-y-1">
                <MathView
                  math="s^2 = \frac{1}{N - 1} \sum_{i=1}^N (x_i - \bar{x})^2, \quad s = \sqrt{s^2}"
                  block
                />
                <MathView
                  math="CV = \frac{s}{\bar{x}} \times 100\%, \quad \text{CI}_{95\%} = \bar{x} \pm 1.96 \frac{s}{\sqrt{N}}"
                  block
                />
              </div>
              <ul className="space-y-1 text-[11px] text-slate-700 font-sans">
                <li>
                  <strong>
                    Standard Deviation (<MathView math="s" />
                    ):
                  </strong>{' '}
                  Average dispersion around the mean, measured in original concentration units
                  (µg/L).
                </li>
                <li>
                  <strong>
                    Sample Variance (<MathView math="s^2" />
                    ):
                  </strong>{' '}
                  Squared dispersion (µg²/L²), reflecting cumulative uncertainty across model
                  variables.
                </li>
                <li>
                  <strong>
                    Coefficient of Variation (<MathView math="CV" />
                    ):
                  </strong>{' '}
                  Ratio of standard deviation to the mean, allowing comparison of relative spread
                  across compounds.
                </li>
                <li>
                  <strong>95% Mean Confidence Interval:</strong> Estimated bounds for the population
                  mean. Stratified Latin Hypercube Sampling narrows these bounds compared to simple
                  random sampling.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Health Risk Assessment & Hazard Quotient */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            4. Health risk assessment and critical thresholds
          </h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-sans">
          Predicted steady-state serum concentrations (<MathView math="C_{ss}" />) and dynamic body
          burdens (<MathView math="B(t)" />) are compared against drinking water Maximum Contaminant
          Levels (MCL) and compound-specific chronic RfD/MRL values. The selected values are EPA
          Office of Water 2024 for PFOA/PFOS, Ecology-selected MDH for PFHxS, Ecology-selected
          modified ATSDR MRL for PFNA, and EPA Office of Water 2021 for HFPO-DA (GenX).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-red-900 font-bold text-sm font-heading">
              Hazard Quotient (HQ) formula
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="HQ_j = \frac{I_j / BW}{\text{RfD}_j}" block />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              An <MathView math="HQ \le 1.0" /> indicates exposures within established toxicological
              safety thresholds. An <MathView math="HQ > 1.0" /> indicates potential adverse health
              exceedance.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-purple-900 font-bold text-sm font-heading">
              Critical baseline body burden (<MathView math="B_{\text{crit}}" />)
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView
                math="B_{\text{crit}}(t) = \frac{BW \cdot \text{RfD} \cdot f_{\text{abs}}}{k_e} \left(1 - e^{-k_e \cdot t}\right)"
                block
              />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              At chronic exposure durations (<MathView math="t = 25 - 30\text{ years}" />
              ), internal retention reaches &gt;99% of steady-state capacity for PFOA/PFNA and
              &gt;87% for PFHxS (
              <MathView math="B_{\text{crit, ss}} = \frac{BW \cdot \text{RfD} \cdot f_{\text{abs}}}{k_e}" />
              ).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5 col-span-1 md:col-span-2">
            <h3 className="text-teal-900 font-bold text-sm font-heading">
              Exploratory sum of hazard quotients
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView
                math="\text{HQ sum} = \sum_{j=1}^M HQ_j = \sum_{j=1}^M \frac{I_j / BW}{\text{RfD}_j}"
                block
              />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              This model sums HQs across its five modeled compounds under an assumed dose-additivity
              approach. It is an exploratory index, not the EPA NPDWR drinking-water Hazard Index:
              that regulatory HI uses measured water concentrations relative to health-based water
              concentrations and includes PFBS, which this model does not currently include. In this
              model, each compound has its own sampled daily-intake distribution. Preset intake
              distributions are provisional assumptions because compound-specific intake data are
              not available in the supplied assessments. Do not interpret this sum as an EPA
              regulatory determination.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Sensitivity Analysis */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Flame className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            5. Sensitivity and parameter uncertainty (PRCC & Spearman Rank)
          </h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-sans">
          Sensitivity analysis measures how much each uncertain input parameter affects predicted
          serum concentration (<MathView math="C_{ss}" />) and body burden. In addition to bivariate{' '}
          <strong>Spearman rank correlation</strong>, global sensitivity is quantified via{' '}
          <strong>Partial Rank Correlation Coefficients (PRCC)</strong>, which controls for the
          covariation of all other <MathView math="k-1" /> model parameters.
        </p>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
          <h3 className="text-amber-900 font-bold text-sm font-heading">
            Partial Rank Correlation Coefficient (PRCC)
          </h3>
          <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
            <MathView
              math="\text{PRCC}(X_j, Y) = -\frac{B_{j, p}}{\sqrt{B_{j,j} \cdot B_{p,p}}}, \quad B = C^{-1}"
              block
            />
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
            Where <MathView math="C" /> is the rank correlation matrix of all model parameters and
            output <MathView math="Y" />, and <MathView math="B" /> is its inverse. Statistical
            significance is evaluated using Student&apos;s <MathView math="t" />
            -distribution with <MathView math="df = N - k - 1" />:
          </p>
          <div className="text-slate-900 bg-white p-2.5 rounded-lg border border-slate-300 text-center font-semibold text-xs">
            <MathView math="t = \text{PRCC} \sqrt{\frac{N - k - 1}{1 - \text{PRCC}^2}}" block />
          </div>
          <p className="text-slate-600 text-[11px] font-sans">
            A parameter exerts a statistically and biologically meaningful effect (
            <MathView math="H_1 3" />) when <MathView math="|\text{PRCC}| \ge 0.10" /> and{' '}
            <MathView math="p < 0.05" />.
          </p>
        </div>
      </section>

      {/* Section 6: Scenario Analysis */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <Users className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            6. Scenario analysis and demographic profiling
          </h2>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-sans">
          The tool compares risk across demographic and physiological cohorts using calibrated
          presets:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="text-teal-900 font-bold text-sm font-heading">Average Filipino woman</h3>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Calibrated from Philippine National Nutrition Council (NNC) health surveys: baseline
              adult body weight of <strong>55.4 kg</strong>, baseline tropical drinking water intake
              of <strong>2.0 L/day</strong>, and a chronic exposure duration of{' '}
              <strong>22 years</strong> derived from adult chronological age (NDHS).
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-purple-900 font-bold text-sm font-heading">
              Pregnant female profile
            </h3>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Uses a pregnant-cohort scenario with hydration demand (<strong>2.8 L/day</strong>) and
              gestational mass (<strong>65.2 kg</strong>), transplacental clearance dynamics
              shortening maternal serum half-life supplied as a scenario assumption, and a
              pre-gestational exposure horizon of
              <strong>19 years</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Study SOP, Hypotheses, and Inferential Statistics */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <CheckCircle className="w-5 h-5 text-purple-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            7. Statement of the problem (SOP), hypotheses, and statistical framework
          </h2>
        </div>

        {/* 7.1 Statement of the Problem */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-mono font-bold">
              Research Problem
            </span>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Statement of the problem (SOP)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Specifically, this study seeks to answer the following four scientific and toxicokinetic
            questions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-purple-900 font-heading text-xs block">
                1. Steady-state serum concentration (<MathView math="C_{ss}" />)
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                What are the estimated steady-state serum PFAS concentrations (
                <MathView math="C_{ss}" />) among Average and Pregnant Filipino Women modeled using
                a one-compartment toxicokinetic model with Latin Hypercube Sampling, and do the two
                cohorts differ significantly for:
              </p>
              <ul className="text-[11px] text-slate-700 font-mono space-y-0.5 pl-2">
                <li>1.1 Perfluorooctanoic acid (PFOA)</li>
                <li>1.2 Perfluorooctane sulfonate (PFOS)</li>
                <li>1.3 Perfluorohexane sulfonic acid (PFHxS)</li>
                <li>1.4 Perfluorononanoic acid (PFNA)</li>
                <li>1.5 HFPO-DA (GenX)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-purple-900 font-heading text-xs block">
                2. Cumulative body burden (<MathView math="B(t)" />)
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                What is the average cumulative PFAS body burden accumulated over calibrated exposure
                windows (<strong>22 years</strong> for Average and <strong>19 years</strong> for
                Pregnant Filipino Women), and does body burden differ significantly between cohorts
                for:
              </p>
              <ul className="text-[11px] text-slate-700 font-mono space-y-0.5 pl-2">
                <li>2.1 PFOA</li>
                <li>2.2 PFOS</li>
                <li>2.3 PFHxS</li>
                <li>2.4 PFNA</li>
                <li>2.5 GenX</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-purple-900 font-heading text-xs block">
                3. Parameter sensitivity analysis
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                How do individual physiological and behavioral input parameters influence predicted
                steady-state serum concentrations (<MathView math="C_{ss}" />) in global sensitivity
                analysis, and which parameters serve as the primary drivers of internal dose?
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-purple-900 font-heading text-xs block">
                4. Health risk level and population exceedance
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                What is the estimated health risk among Average and Pregnant Filipino Women,
                expressed as compound-specific Hazard Quotients (HQ) and an exploratory sum of HQs
                derived from selected compound-specific chronic RfD/MRL values, and what percentage
                of simulated women exceeds an HQ or exploratory HQ sum of 1.0 for:
              </p>
              <ul className="text-[11px] text-slate-700 font-mono space-y-0.5 pl-2">
                <li>4.1 PFOA</li>
                <li>4.2 PFOS</li>
                <li>4.3 PFHxS</li>
                <li>4.4 PFNA</li>
                <li>4.5 GenX</li>
                <li>4.6 Exploratory sum of HQs across the five modeled compounds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 7.2 Formal Hypotheses */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-bold">
              Inferential Framework
            </span>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Null (H₀) and Alternative (H₁) hypotheses (all tests at α = 0.05, run separately for
              each PFAS)
            </h3>
          </div>

          <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
            {/* H0 1 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Hypothesis 1: Serum Concentration Difference (Two-Sided Mann-Whitney U Test)
                </h4>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  α = 0.05
                </span>
              </div>
              <p>
                <strong>H₀ 1:</strong> Steady-state serum PFAS concentration (
                <MathView math="C_{ss}" />) does not differ significantly between Average and
                Pregnant Filipino Women.
                <br />
                <strong>H₁ 1:</strong> Steady-state serum PFAS concentration (
                <MathView math="C_{ss}" />) differs significantly between Average and Pregnant
                Filipino Women.
              </p>
              <div className="text-slate-900 bg-white p-3 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs">
                <MathView
                  math="U_1 = R_1 - \frac{n_1(n_1 + 1)}{2}, \quad U_2 = n_1 n_2 - U_1, \quad Z = \frac{U_1 - \mu_U}{\sigma_U}, \quad r = 1 - \frac{2U}{n_1 n_2}"
                  block
                />
              </div>
            </div>

            {/* H0 2 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Hypothesis 2: Cumulative Body Burden Difference (Two-Sided Mann-Whitney U Test)
                </h4>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  α = 0.05
                </span>
              </div>
              <p>
                <strong>H₀ 2:</strong> Cumulative PFAS body burden accumulated over the modeled
                exposure window (22 years for Average vs. 19 years for Pregnant Filipino Women) does
                not differ significantly between Average and Pregnant Filipino Women.
                <br />
                <strong>H₁ 2:</strong> Cumulative PFAS body burden differs significantly between
                Average and Pregnant Filipino Women.
              </p>
              <div className="text-slate-900 bg-white p-3 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs">
                <MathView
                  math="B(t) = \frac{I \cdot f_{\text{abs}}}{k_e}\left(1 - e^{-k_e \cdot t}\right), \quad t_{\text{avg}} = 22 \text{ yrs}, \quad t_{\text{preg}} = 19 \text{ yrs}"
                  block
                />
              </div>
            </div>

            {/* H0 3 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Hypothesis 3: Parameter Sensitivity on Serum Concentration (PRCC)
                </h4>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  |PRCC| &ge; 0.10, p &lt; 0.05
                </span>
              </div>
              <p>
                <strong>H₀ 3:</strong> No toxicokinetic model parameter has a significant monotonic
                effect on estimated steady-state serum concentration (<MathView math="C_{ss}" />
                ).
                <br />
                <strong>H₁ 3:</strong> At least one toxicokinetic model parameter has a significant
                monotonic effect on estimated steady-state serum concentration (
                <MathView math="C_{ss}" />
                ).
              </p>
              <div className="text-slate-900 bg-white p-3 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs">
                <MathView
                  math="\text{PRCC}(X_j, C_{ss}) = -\frac{B_{j, p}}{\sqrt{B_{j,j} \cdot B_{p,p}}}, \quad t = \text{PRCC} \sqrt{\frac{N - k - 1}{1 - \text{PRCC}^2}}"
                  block
                />
              </div>
            </div>

            {/* H0 4 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Hypothesis 4: Health Risk Level (One-Sample One-Sided Wilcoxon Signed-Rank Test)
                </h4>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  Threshold = 1.0, α = 0.05
                </span>
              </div>
              <p>
                <strong>H₀ 4:</strong> Exposure risk is not significant: the median Hazard Quotient
                for each PFAS and the median exploratory sum of HQs do not exceed 1.0 based on the
                selected compound-specific chronic RfD/MRL values.
                <br />
                <strong>H₁ 4:</strong> Exposure risk is significant: the median Hazard Quotient for
                a PFAS, or the median exploratory sum of HQs, exceeds 1.0 based on the selected
                compound-specific chronic RfD/MRL values.
              </p>
              <div className="text-slate-900 bg-white p-3 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs">
                <MathView
                  math="W^+ = \sum_{D_i > 0} \text{rank}(|D_i|), \quad D_i = \text{HQ}_i - 1.0, \quad Z = \frac{W^+ - \mu_W - 0.5}{\sigma_W}"
                  block
                />
              </div>
            </div>
          </div>
        </div>

        {/* 7.3 Methodological Evolution: Old SOP vs New Proposed SOP */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
              Evolutionary Comparison
            </span>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Methodological transition: Old SOP & hypotheses vs. New proposed framework
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="py-2 px-3 font-semibold w-1/5">Research Domain</th>
                  <th className="py-2 px-3 font-semibold w-2/5">
                    Initial Framework (Old SOP & Hypotheses)
                  </th>
                  <th className="py-2 px-3 font-semibold w-2/5">
                    Calibrated Framework (New Proposed SOP & Hypotheses)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-[11px] leading-relaxed">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Question 1 & Hypothesis 1<br />
                    <span className="font-mono text-[10px] text-slate-500 font-normal">
                      Serum Concentration (Css)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Estimated Css in relation to external Human Biomonitoring thresholds (HBM-I and
                    HBM-II). Hypotheses tested whether Css exceeds European HBM guidance values.
                  </td>
                  <td className="py-3 px-3 text-emerald-900 bg-emerald-50/30">
                    <strong>Direct cohort comparative inferential testing:</strong> Two-sided
                    Mann-Whitney U test (α = 0.05) comparing Average and Pregnant Filipino Women
                    across all 5 target PFAS to measure physiological differences from gestational
                    hemodilution.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Question 2 & Hypothesis 2<br />
                    <span className="font-mono text-[10px] text-slate-500 font-normal">
                      Accumulated Body Burden
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Modeled accumulated body burden over an arbitrary generic{' '}
                    <em>30-year study period</em> in relation to HBM guidance and critical burden
                    limits.
                  </td>
                  <td className="py-3 px-3 text-emerald-900 bg-emerald-50/30">
                    <strong>Demographically calibrated exposure horizons:</strong> Modeled over{' '}
                    <strong>22 years</strong> for Average Filipino Women and{' '}
                    <strong>19 years</strong> for Pregnant Filipino Women based on Philippine NDHS
                    maternal demographic statistics, tested via two-sided Mann-Whitney U test.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Question 3 & Hypothesis 3<br />
                    <span className="font-mono text-[10px] text-slate-500 font-normal">
                      Sensitivity Analysis
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Tested parameter effects on estimated <em>body burden</em> without controlling
                    for parameter covariation or specifying non-parametric partial correlation.
                  </td>
                  <td className="py-3 px-3 text-emerald-900 bg-emerald-50/30">
                    <strong>PRCC on Steady-State Serum Concentration (Css):</strong> Partial Rank
                    Correlation Coefficients isolate monotonic relationships with serum
                    concentration while holding other model inputs constant (|PRCC| &ge; 0.10, p
                    &lt; 0.05).
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Question 4 & Hypothesis 4<br />
                    <span className="font-mono text-[10px] text-slate-500 font-normal">
                      Health Risk & Hazard Indices
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Generic health risk evaluation for individuals exceeding normal thresholds
                    without chemical-specific toxicological benchmark ratios or mixture dose
                    additivity.
                  </td>
                  <td className="py-3 px-3 text-emerald-900 bg-emerald-50/30">
                    <strong>
                      Compound-specific RfD/MRL Hazard Quotients (HQ) and exploratory HQ sum:
                    </strong>{' '}
                    Evaluates 4.1 PFOA, 4.2 PFOS, 4.3 PFHxS, 4.4 PFNA, 4.5 GenX, and 4.6 the
                    exploratory sum of HQs, with population exceedance percentages (% &gt; 1.0) and
                    one-sided Wilcoxon signed-rank tests against 1.0.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
