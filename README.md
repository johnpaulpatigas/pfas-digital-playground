# PFAS Toxicokinetic Modeling Playground

An interactive simulation platform for **Probabilistic Toxicokinetic Modeling of Per- and Polyfluoroalkyl Substances (PFAS) Exposure among Filipino Women Utilizing Monte Carlo Simulation and Latin Hypercube Sampling**.

## Overview
This platform provides researchers, toxicologists, environmental health scientists, and educators with computational tools to simulate chemical exposure, compare probabilistic sampling methods (Monte Carlo vs. Latin Hypercube Sampling), model body burden and blood concentration over time, and evaluate population-level risk uncertainties.

### Key Objectives
- **1-Compartment Toxicokinetic Modeling**: Model 1-compartment pharmacokinetic clearance and body accumulation of PFAS compounds (PFOA, PFOS, PFHxS, PFNA, GenX/HFPO-DA).
- **Probabilistic Risk Assessment**: Incorporate statistical variability and parameter uncertainty across physiological and exposure parameters.
- **Sampling Efficiency Comparison**: Benchmark statistical efficiency, convergence rates, and precision between standard Monte Carlo (MC) and Stratified Latin Hypercube Sampling (LHS).
- **Demographic Focus**: Presets and physiological profiles tailored for Filipino female cohorts (Average Adult Female, Urban Manila Resident, High Coastal Seafood Diet, Pregnant Female Profile).

---

## Features
- [x] **Project Build Pipeline**: React 19 + TypeScript + Vite modern build pipeline setup.
- [x] **Clean Design System**: High-contrast, clean layout designed for scientific competitions and presentation.
- [x] **Interactive Parameter & Distribution Controls**: Configure exposure parameters (Daily Intake, Body Weight, Age, Water Consumption, Bioavailability, Half-Life, Exposure Duration) with Fixed, Uniform, Normal, Lognormal, and Triangular distributions.
- [x] **PFAS Chemical Database**: Reference profiles for PFOA, PFOS, PFHxS, PFNA, and GenX with CAS numbers, chemical formulas, and US EPA Maximum Contaminant Levels (MCL).
- [x] **Probabilistic Sampling Engines**: Seedable PRNG (Mulberry32), standard Normal Box-Muller transform, Inverse CDF Quantile functions, and Stratified Latin Hypercube Sampling modules.
- [x] **Toxicokinetic & Risk Engine**: Compute body burden ($B(t)$), blood concentration ($C_{ss}$), clearance rate ($CL$), and Hazard Quotient ($HQ$) risk exceedance ($HQ > 1.0$).
- [x] **Interactive Visualizations**: Recharts-powered frequency histogram, cumulative distribution (CDF), dynamic time-course trajectory ($C(t)$ over 40 years), intake vs. serum scatter plot, Spearman rank tornado plot, and convergence curves.
- [x] **Statistical Analysis & Sensitivity Engine**: Calculate mean, median, standard deviation, variance, percentiles ($P_5, P_{25}, P_{75}, P_{95}, P_{99}$), 95% confidence intervals, and Spearman rank parameter sensitivity.
- [x] **Methodology Comparison Mode**: Head-to-head performance analysis (runtime in ms, variance, convergence rate, CI bounds).
- [x] **Data Matrix & Export**: Paginated iteration data matrix and export to CSV or JSON.

---

## Tech Stack
| Technology | Description / Purpose |
| :--- | :--- |
| **React 19** | UI components & concurrent rendering engine |
| **TypeScript** | Strict static typing and mathematical domain safety |
| **Vite** | Next-generation frontend build tooling and HMR |
| **TailwindCSS** | Utility-first styling with clean design system |
| **KaTeX** | Publication-grade LaTeX mathematical formula rendering |
| **Zustand** | Lightweight, reactive state management store |
| **React Router** | Single-page application routing |
| **Recharts** | Declarative data visualization charts for scientific metrics |
| **Framer Motion** | Micro-interactions and fluid layout transitions |
| **Lucide React** | Modern scientific icon set |

---

## Folder Structure
```
src/
├── components/   # Generic reusable UI primitives (Card, Button, Tooltip, MathView)
├── features/     # Domain feature modules
│   ├── charts/       # Interactive charts (Histogram, CDF, TimeCourse, Scatter, Tornado, Convergence)
│   ├── playground/   # Parameter controls, distribution selector, console log
│   ├── scenarios/    # Preset demographic profiles for Filipino cohorts
│   └── statistics/   # Summary statistics & hazard quantile tables
├── layouts/      # Application layout frame (Header, Nav, Footer)
├── pages/        # Route views (HomePage, PlaygroundPage, ComparePage, DocsPage)
├── simulation/   # Core scientific algorithms (distributions, MC, LHS, toxicokinetics, pfasCompounds, statistics)
├── stores/       # Zustand store declarations (useSimulationStore)
├── types/        # TypeScript models, parameter schemas & domain types
└── utils/        # Export utilities (CSV, JSON)
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

---

## Mathematical & Sampling Models

### 1-Compartment Toxicokinetic Model
The steady-state blood concentration ($C_{ss}$), time-dependent serum concentration ($C(t)$), and body burden ($B(t)$) are modeled as:

$$k_e = \frac{\ln(2)}{T_{1/2} \times 365.25}$$

$$C_{ss} = \frac{I \times f_{\text{abs}}}{BW \times V_d \times k_e}$$

$$C(t) = C_{ss} \left(1 - e^{-k_e \cdot t}\right)$$

where:
- $I$: Daily PFAS intake ($\mu g/\text{day}$)
- $f_{\text{abs}}$: Bioavailability / Gastrointestinal absorption fraction
- $BW$: Body weight ($\text{kg}$)
- $V_d$: Volume of distribution ($\text{L/kg}$)
- $k_e$: First-order elimination rate constant ($\text{day}^{-1}$)
- $T_{1/2}$: Biological elimination half-life ($\text{years}$)
