# PFAS toxicokinetic modeling playground

An interactive simulation tool for probabilistic toxicokinetic modeling of per- and polyfluoroalkyl substances (PFAS) exposure among Filipino women, using Monte Carlo simulation and Latin hypercube sampling.

## Overview
This application lets users simulate chemical exposure, compare Monte Carlo and Latin hypercube sampling, model body burden and serum concentration over time, and evaluate population-level risk distributions.

### Key objectives
- **1-compartment toxicokinetic modeling**: Model clearance and accumulation for target PFAS compounds (PFOA, PFOS, PFHxS, PFNA, and GenX/HFPO-DA).
- **Probabilistic risk assessment**: Account for parameter uncertainty across physiological and exposure variables.
- **Sampling comparison**: Compare variance, runtime, and convergence rates between standard Monte Carlo (MC) and stratified Latin hypercube sampling (LHS).
- **Demographic focus**: Use physiological baseline profiles calibrated for Filipino female cohorts, including non-pregnant and pregnant profiles.

---

## Features
- **Interactive parameter controls**: Configure distributions (fixed, uniform, normal, lognormal, triangular) for daily intake, body weight, water intake, bioavailability, elimination half-life, and exposure duration.
- **PFAS compound database**: Chemical profiles for PFOA, PFOS, PFHxS, PFNA, and GenX with CAS numbers, formulas, half-lives, and EPA Maximum Contaminant Levels (MCL).
- **Sampling engines**: Seedable pseudo-random generation (Mulberry32), Box-Muller transform, inverse CDF quantiles, and stratified Latin hypercube sampling.
- **Toxicokinetics and risk metrics**: Calculate body burden ($B(t)$), steady-state serum concentration ($C_{ss}$), clearance rate ($CL$), and Hazard Quotient ($HQ$) exceedance fractions ($HQ > 1.0$).
- **Visualizations**: Frequency histogram, cumulative distribution (CDF), time-course trajectory ($C(t)$ over 40 years), intake vs. serum scatter plot, Spearman rank tornado plot, and running mean convergence lines.
- **Sensitivity analysis**: Summary statistics (mean, median, standard deviation, variance, confidence intervals, 5th to 99th percentiles) and Spearman rank correlation coefficients.
- **Method comparison view**: Head-to-head analysis of runtime, variance, and convergence between MC, LHS, and hybrid MC+LHS.
- **Data export**: Paginated iteration table with CSV and JSON export.

---

## Tech stack
| Technology | Purpose |
| :--- | :--- |
| **React 19** | Component UI and state rendering |
| **TypeScript** | Static typing and domain schemas |
| **Vite** | Build tool and local development server |
| **TailwindCSS** | Layout styling |
| **KaTeX** | Formula rendering |
| **Zustand** | Client-side state store |
| **React Router** | Client-side routing |
| **Recharts** | Chart visualizations |
| **Framer Motion** | UI transitions |
| **Lucide React** | Icons |

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
├── simulation/   # Core algorithms (distributions, MC, LHS, toxicokinetics, compounds, statistics)
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

### Building for production
```bash
npm run build
```

---

## Mathematical and sampling models

### 1-compartment toxicokinetic model
The steady-state blood concentration ($C_{ss}$), time-dependent serum concentration ($C(t)$), and body burden ($B(t)$) are modeled as:

$$k_e = \frac{\ln(2)}{T_{1/2} \times 365.25}$$

$$C_{ss} = \frac{I \times f_{\text{abs}}}{BW \times V_d \times k_e}$$

$$C(t) = C_{ss} \left(1 - e^{-k_e \cdot t}\right)$$

where:
- $I$: Daily PFAS intake ($\mu g/\text{day}$)
- $f_{\text{abs}}$: Bioavailability / gastrointestinal absorption fraction
- $BW$: Body weight ($\text{kg}$)
- $V_d$: Volume of distribution ($\text{L/kg}$)
- $k_e$: First-order elimination rate constant ($\text{day}^{-1}$)
- $T_{1/2}$: Biological elimination half-life ($\text{years}$)

