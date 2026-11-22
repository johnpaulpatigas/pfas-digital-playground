# PFAS toxicokinetic modeling playground

An interactive simulation tool for probabilistic toxicokinetic modeling of per- and polyfluoroalkyl substances (PFAS) exposure among Filipino women, using Monte Carlo simulation and Latin hypercube sampling.

## Overview

This application lets users simulate chemical exposure, compare Monte Carlo and Latin hypercube sampling, model body burden and serum concentration over time, and evaluate population-level risk distributions.

### Key objectives

- 1-compartment toxicokinetic modeling: Model clearance and accumulation for target PFAS compounds (PFOA, PFOS, PFHxS, PFNA, and GenX/HFPO-DA).
- Probabilistic risk assessment: Account for parameter uncertainty across physiological and exposure variables.
- Sampling comparison: Compare variance, runtime, and convergence rates between standard Monte Carlo (MC), stratified Latin hypercube sampling (LHS), and hybrid MC+LHS.
- Demographic focus: Use physiological baseline profiles calibrated for Filipino female cohorts, including non-pregnant and pregnant profiles.

---

## Features

- Dual simulation modes: Simple mode provides demographic presets, an automated 100,000-iteration blended run, and flags the highest accumulated compound. Advanced mode offers granular parameter controls across five distribution types.
- Interactive parameter distributions: Configure fixed, uniform, normal, lognormal, and triangular distributions for daily intake, body weight, water intake, bioavailability, elimination half-life, and exposure duration.
- PFAS compound database: Chemical profiles for PFOA, PFOS, PFHxS, PFNA, and GenX with CAS numbers, formulas, half-lives, volumes of distribution, and US EPA Maximum Contaminant Levels (MCL).
- Asynchronous Web Worker engine: Runs compute-heavy sampling loops off the main thread to keep charts and controls responsive.
- Toxicokinetics and risk metrics: Calculate body burden ($B(t)$), steady-state serum concentration ($C_{ss}$), clearance rate ($CL$), single-substance Hazard Quotient ($HQ$), and cumulative PFAS mixture Hazard Index ($HI$) with threshold exceedance percentages ($HQ > 1.0$, $HI > 1.0$).
- Visualizations: Interactive frequency histogram, cumulative distribution (CDF), dynamic 40-year time-course curves, intake versus serum scatter plot, Spearman rank tornado sensitivity plot, and running mean convergence tracking.
- Method comparison view: Head-to-head benchmarking of runtime, variance, and convergence rates between MC, LHS, and hybrid MC+LHS.
- Data export: Paginated iteration table with CSV and JSON exports, including calculated Hazard Quotient and mixture Hazard Index columns.

---

## Tech stack

| Technology       | Purpose                                 |
| :--------------- | :-------------------------------------- |
| **React 19**     | Component UI and state rendering        |
| **TypeScript**   | Static typing and domain schemas        |
| **Vite**         | Build tool and local development server |
| **TailwindCSS**  | Layout styling                          |
| **KaTeX**        | Formula rendering                       |
| **Zustand**      | Client-side state store                 |
| **React Router** | Client-side routing                     |
| **Recharts**     | Chart visualizations                    |
| **Motion**       | UI transitions                          |
| **Lucide React** | Icons                                   |
| **Vitest**       | Unit test runner and coverage tracking  |
| **Capacitor**    | Android mobile runtime support          |

---

## Folder structure

```
src/
├── components/   # Reusable UI primitives (Card, Button, Tooltip, MathView)
├── features/     # Feature modules
│   ├── charts/       # Charts (Histogram, CDF, TimeCourse, Scatter, Tornado, Convergence)
│   ├── playground/   # Parameter inputs, distribution selector, execution console
│   ├── scenarios/    # Preset demographic profiles for Filipino cohorts
│   └── statistics/   # Summary statistics and quantile tables
├── layouts/      # App layout (Header, Nav, Mobile Drawer)
├── pages/        # Route pages (HomePage, PlaygroundPage, ComparePage, DocsPage, ScientificGuidePage)
├── simulation/   # Core algorithms (distributions, MC, LHS, toxicokinetics, compounds, statistics, worker)
├── stores/       # Zustand store declarations (useSimulationStore)
├── types/        # TypeScript interfaces and parameter schemas
└── utils/        # Export helpers (CSV, JSON)
```

---

## Installation and setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running locally

```bash
npm run dev
```

### Running tests

```bash
npm test
```

### Running tests with coverage

```bash
npm run test:coverage
```

### Linting

```bash
npm run lint
```

### Building for production

```bash
npm run build
```

---

## Mathematical and sampling models

### 1-compartment toxicokinetic model

The first-order elimination rate constant ($k_e$), steady-state serum concentration ($C_{ss}$), dynamic serum concentration over time ($C(t)$), and accumulated body burden ($B(t)$) are modeled as follows:

$$k_e = \frac{\ln(2)}{T_{1/2} \times 365.25}$$

$$C_{ss} = \frac{I \times f_{\text{abs}}}{BW \times V_d \times k_e}$$

$$C(t) = C_{ss} \left(1 - e^{-k_e \cdot t}\right)$$

$$B(t) = \frac{I \times f_{\text{abs}}}{k_e} \left(1 - e^{-k_e \cdot t}\right)$$

$$CL = k_e \times V_d$$

where:

- $I$: Daily PFAS intake ($\mu\text{g/day}$)
- $f_{\text{abs}}$: Bioavailability or gastrointestinal absorption fraction (unitless)
- $BW$: Body weight ($\text{kg}$)
- $V_d$: Volume of distribution ($\text{L/kg}$)
- $k_e$: First-order elimination rate constant ($\text{day}^{-1}$)
- $T_{1/2}$: Biological elimination half-life ($\text{years}$)
- $t$: Cumulative exposure duration ($\text{days}$)
- $CL$: Whole-body clearance rate ($\text{L/kg/day}$)

### Risk assessment metrics

Individual and mixture health risks are evaluated using oral Reference Doses (RfD):

$$HQ = \frac{\text{Daily Dose}}{\text{RfD}} = \frac{I / BW}{\text{RfD}}$$

$$HI = \sum_{j=1}^{M} HQ_j = \sum_{j=1}^{M} \frac{I_j / BW}{\text{RfD}_j}$$

An $HQ \le 1.0$ or $HI \le 1.0$ indicates that estimated intake remains within established toxicological thresholds. Values exceeding $1.0$ indicate potential non-cancer adverse health risks.

### Population quantiles and variance metrics

Output distributions from probabilistic Monte Carlo and Latin hypercube sampling are evaluated using non-parametric population percentiles and variance dispersion metrics:

- **Population Quantiles ($P_k$):** Percentiles derived from sorted iteration values ($P_k = F^{-1}(k/100)$).
  - $P_5$: Lower baseline exposure boundary (only 5% of simulated women have lower serum levels).
  - $P_{25}\text{ to }P_{75}$ (Interquartile Range, IQR): Middle 50% core exposure tier, resistant to extreme outliers.
  - $P_{50}$ (Median): Primary measure of central tendency for right-skewed environmental contaminant distributions.
  - $P_{95}$: High-exposure regulatory benchmark representing sensitive or upper-tier exposed subpopulations.
  - $P_{99}$: Extreme upper tail representing worst-case compounding physiological and intake factors.
- **Variance Metrics:**
  - Sample Variance ($s^2 = \frac{1}{N - 1} \sum (x_i - \bar{x})^2$): Quantifies total parametric dispersion ($\mu\text{g}^2/\text{L}^2$) from physiological and behavioral inputs.
  - Standard Deviation ($s = \sqrt{s^2}$): Spread of individual serum levels around the cohort mean ($\mu\text{g/L}$).
  - Coefficient of Variation ($CV = \frac{s}{\bar{x}} \times 100\%$): Standard deviation divided by the mean, used to compare relative variation across compounds.
  - 95% Confidence Interval ($\bar{x} \pm 1.96 \frac{s}{\sqrt{N}}$): Estimated bounds for the population mean.

---

## Study Statement of the Problem (SOP) and Hypotheses

### Statement of the Problem (SOP)

This study addresses the following research questions:

1. **What are the estimated steady-state serum PFAS concentrations ($C_{ss}$) among Average and Pregnant Filipino Women modeled using a one-compartment toxicokinetic model with Latin Hypercube Sampling, and do the two cohorts differ significantly for:**
   - 1.1 Perfluorooctanoic acid (PFOA)
   - 1.2 Perfluorooctane sulfonate (PFOS)
   - 1.3 Perfluorohexane sulfonic acid (PFHxS)
   - 1.4 Perfluorononanoic acid (PFNA)
   - 1.5 HFPO-DA (GenX)
2. **What is the average cumulative PFAS body burden accumulated over calibrated exposure periods (22 years for Average and 19 years for Pregnant Filipino Women), and does body burden differ significantly between cohorts for:**
   - 2.1 PFOA
   - 2.2 PFOS
   - 2.3 PFHxS
   - 2.4 PFNA
   - 2.5 GenX
3. **How do individual physiological and behavioral input parameters influence predicted steady-state serum concentrations ($C_{ss}$) in global sensitivity analysis, and which parameters serve as the primary drivers of internal dose?**
4. **What is the estimated health risk among Average and Pregnant Filipino Women, expressed as compound-specific Hazard Quotients (HQ) and a mixture Hazard Index (HI) derived from U.S. EPA oral reference doses (RfD), and what percentage of simulated women exceeds an HQ or HI of 1.0 for:**
   - 4.1 PFOA
   - 4.2 PFOS
   - 4.3 PFHxS
   - 4.4 PFNA
   - 4.5 GenX
   - 4.6 Combined PFAS mixture (Hazard Index)

### Hypotheses (all tests at $\alpha = 0.05$, run separately for each PFAS)

- **$H_0 1$:** Steady-state serum PFAS concentration ($C_{ss}$) does not differ significantly between Average and Pregnant Filipino Women.
  **$H_1 1$:** Steady-state serum PFAS concentration ($C_{ss}$) differs significantly between Average and Pregnant Filipino Women.
  _(Two-sided Mann-Whitney U test)_

- **$H_0 2$:** Cumulative PFAS body burden accumulated over the modeled exposure window does not differ significantly between Average (22 years) and Pregnant (19 years) Filipino Women.
  **$H_1 2$:** Cumulative PFAS body burden differs significantly between Average and Pregnant Filipino Women.
  _(Two-sided Mann-Whitney U test)_

- **$H_0 3$:** No toxicokinetic model parameter has a significant monotonic effect on estimated steady-state serum concentration ($C_{ss}$).
  **$H_1 3$:** At least one toxicokinetic model parameter has a significant monotonic effect on estimated steady-state serum concentration ($C_{ss}$).
  *(Partial Rank Correlation Coefficient, $|PRCC| \ge 0.10$, $p < 0.05$)*

- **$H_0 4$:** Exposure risk is not significant: the median Hazard Quotient for each compound and the median mixture Hazard Index do not exceed 1.0 based on the EPA oral RfD.
  **$H_1 4$:** Exposure risk is significant: the median Hazard Quotient for a compound, or the median mixture Hazard Index, exceeds 1.0 based on the EPA oral RfD.
  _(One-sided one-sample Wilcoxon signed-rank test against 1.0, run for each PFAS and the HI in each group)_

### Methodological Evolution (Old SOP vs. New Proposed SOP)

| Domain                    | Initial Framework (Old SOP & Hypotheses)                         | Calibrated Framework (New Proposed SOP & Hypotheses)                                                                             | Rationale                                                                                                                       |
| :------------------------ | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Q1 / H1 ($C_{ss}$)**    | Comparison against European HBM guidance values (HBM-I & HBM-II) | Two-sided Mann-Whitney U test between Average and Pregnant cohorts                                                               | European HBM guidance lacks thresholds for newer replacements (GenX); direct cohort testing quantifies physiological disparity. |
| **Q2 / H2 (Body Burden)** | Arbitrary generic 30-year exposure period                        | Demographically calibrated horizons: 22 yrs (Average) vs. 19 yrs (Pregnant)                                                      | Calibrated to Philippine National Demographic and Health Survey (NDHS) maternal and reproductive age data.                      |
| **Q3 / H3 (Sensitivity)** | Parameter sensitivity on body burden                             | PRCC global sensitivity on steady-state serum concentration ($C_{ss}$)                                                           | Partial rank correlation isolates independent drivers while controlling for parameter covariation ($                            | PRCC | \ge 0.10, p < 0.05$). |
| **Q4 / H4 (Health Risk)** | Generic body burden threshold exceedance                         | U.S. EPA oral RfD Hazard Quotients (4.1 to 4.5), Mixture Hazard Index (4.6), % &gt; 1.0, and one-sided Wilcoxon signed-rank test | Follows EPA and ATSDR mixture guidance. Using the median avoids distortion from skewed distributions.                           |
