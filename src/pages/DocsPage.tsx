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
              Where <MathView math="T_{1/2}" /> is biological excretion half-life in years. For PFOA
              and PFOS, human half-lives average 2.7 to 5.4 years due to renal tubular reabsorption.
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
              Where <MathView math="I" /> is daily intake (&micro;g/day),{' '}
              <MathView math="f_{abs}" /> is the gastrointestinal absorption fraction,{' '}
              <MathView math="BW" /> is body weight in kg, and <MathView math="V_d" /> is volume of
              distribution (~0.17 L/kg for PFOA).
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
              ). Generated using the Box-Muller transform:
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
          Levels (MCL) and oral Reference Doses (RfD).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-red-900 font-bold text-sm font-heading">
              Hazard Quotient (HQ) formula
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView math="HQ = \frac{I / BW}{\text{RfD}}" block />
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
              Cumulative PFAS mixture Hazard Index (HI)
            </h3>
            <div className="text-slate-900 bg-white p-3.5 rounded-lg border border-slate-300 text-center font-semibold text-sm">
              <MathView
                math="HI = \sum_{j=1}^M HQ_j = \sum_{j=1}^M \frac{I_j / BW}{\text{RfD}_j}"
                block
              />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
              Under US EPA and ATSDR guidelines for PFAS mixtures, cumulative risk is evaluated by
              summing individual hazard quotients across target chemicals. An{' '}
              <MathView math="HI \le 1.0" /> indicates that combined mixture exposure remains within
              non-cancer safety benchmarks, while an <MathView math="HI > 1.0" /> indicates elevated
              cumulative risk.
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
            significance is evaluated using Student&apos;s <MathView math="t" />-distribution with{' '}
            <MathView math="df = N - k - 1" />:
          </p>
          <div className="text-slate-900 bg-white p-2.5 rounded-lg border border-slate-300 text-center font-semibold text-xs">
            <MathView math="t = \text{PRCC} \sqrt{\frac{N - k - 1}{1 - \text{PRCC}^2}}" block />
          </div>
          <p className="text-slate-600 text-[11px] font-sans">
            A parameter exerts a statistically and biologically meaningful effect (<MathView math="H_1 3" />)
            when <MathView math="|\text{PRCC}| \ge 0.10" /> and <MathView math="p < 0.05" />.
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
              Models gestational hemodilution (+40 to 50% blood plasma volume expansion), increased
              hydration demands (<strong>2.8 L/day</strong>), gestational mass (
              <strong>65.2 kg</strong>), transplacental clearance dynamics shortening maternal
              serum half-life (<strong>2.4 yrs</strong>), and a pre-gestational chronic exposure
              horizon of <strong>19 years</strong> based on NDHS median maternal age.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Study SOP, Hypotheses, and Inferential Statistics */}
      <section className="card-panel p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <CheckCircle className="w-5 h-5 text-purple-700" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            7. Statement of the problem, hypotheses, and statistical framework
          </h2>
        </div>

        <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm font-heading">
              Hypothesis 1 & 2: Cohort Comparison (Two-Sided Mann-Whitney U Test)
            </h3>
            <p>
              To evaluate differences in steady-state serum PFAS concentration (<MathView math="C_{ss}" />)
              (<strong>H₀ 1</strong>) and cumulative body burden (<MathView math="B(t)" />) over modeled
              horizons (22 yrs vs. 19 yrs) (<strong>H₀ 2</strong>) between Average and Pregnant Filipino
              Women:
            </p>
            <div className="text-slate-900 bg-white p-3 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs">
              <MathView
                math="U_1 = R_1 - \frac{n_1(n_1 + 1)}{2}, \quad U_2 = n_1 n_2 - U_1, \quad Z = \frac{U_1 - \mu_U}{\sigma_U}"
                block
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluated at <MathView math="\alpha = 0.05" /> separately for PFOA, PFOS, PFHxS, PFNA, and
              GenX (HFPO-DA). Effect size is quantified via rank-biserial correlation <MathView math="r = 1 - \frac{2U}{n_1 n_2}" />.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm font-heading">
              Hypothesis 3: Parameter Sensitivity (PRCC)
            </h3>
            <p>
              <strong>H₀ 3</strong>: No TK parameter has a significant monotonic effect on steady-state serum
              concentration (<MathView math="C_{ss}" />) (<MathView math="|\text{PRCC}| < 0.10" /> or <MathView math="p \ge 0.05" />).
              <br />
              <strong>H₁ 3</strong>: At least one TK parameter has a significant monotonic effect on <MathView math="C_{ss}" />.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm font-heading">
              Hypothesis 4: Health Risk Level (One-Sample One-Sided Wilcoxon Signed-Rank Test)
            </h3>
            <p>
              <strong>H₀ 4</strong>: The health risk level associated with PFAS exposure is not significant:
              the median Hazard Quotient (<MathView math="\text{HQ}" />) of each PFAS and the median mixture
              Hazard Index (<MathView math="\text{HI}" />) do not exceed 1.0 based on EPA oral Reference Doses
              (<MathView math="\text{RfD}" />).
              <br />
              <strong>H₁ 4</strong>: The median HQ or median HI significantly exceeds 1.0 (<MathView math="p < 0.05" />).
            </p>
            <div className="text-slate-900 bg-white p-3 rounded-lg border border-slate-300 text-center font-mono font-semibold text-xs">
              <MathView
                math="W^+ = \sum_{D_i > 0} \text{rank}(|D_i|), \quad D_i = \text{HQ}_i - 1.0, \quad Z = \frac{W^+ - \mu_W - 0.5}{\sigma_W}"
                block
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
