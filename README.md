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
