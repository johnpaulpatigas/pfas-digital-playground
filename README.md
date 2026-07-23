# PFAS Toxicokinetic Modeling Playground

An interactive, scientific-grade simulation platform for **Probabilistic Toxicokinetic Modeling of Per- and Polyfluoroalkyl Substances (PFAS) Exposure among Filipino Women Utilizing Monte Carlo Simulation and Latin Hypercube Sampling**.

## Overview
This platform provides researchers, toxicologists, environmental health scientists, and educators with tools to simulate chemical exposure, compare probabilistic sampling methods (Monte Carlo vs. Latin Hypercube Sampling), model body burden and blood concentration over time, and evaluate population-level risk uncertainties.

### Key Objectives
- **Toxicokinetic Modeling**: Model 1-compartment pharmacokinetic clearance and body accumulation of PFAS (e.g., PFOA, PFOS, PFHxS, PFNA).
- **Probabilistic Risk Assessment**: Incorporate statistical variability and parameter uncertainty across exposure parameters.
- **Sampling Method Comparison**: Evaluate sampling efficiency, convergence rates, and statistical precision between standard Monte Carlo (MC) and Stratified Latin Hypercube Sampling (LHS).
- **Demographic Focus**: Specialized presets and baseline toxicokinetic profiles tailored for Filipino women (e.g., urban, rural, pregnant, breastfeeding, high seafood consumption profiles).

---

## Features
- [x] **Project Initialization**: React 19 + TypeScript + Vite modern build pipeline setup.
- [x] **Tailwind CSS & Scientific Glassmorphic Theme**: Sleek dark mode visual layout with responsive panels.
- [x] **Application Layout & Navigation Routing**: Sticky glassmorphic header, navigation tabs (Overview, Playground, Compare, Methodology), and persistent footer.
- [x] **Interactive Parameter & Distribution Selector**: Configure exposure parameters (Daily Intake, Body Weight, Age, Water Consumption, Bioavailability, Half-Life, Exposure Duration) with Fixed, Uniform, Normal, Lognormal, and Triangular distributions.
- [x] **Monte Carlo & Latin Hypercube Engine**: Seedable PRNG (Mulberry32), standard Normal Box-Muller, Inverse CDF Quantile functions, and Stratified Latin Hypercube Sampling modules.
- [x] **1-Compartment Toxicokinetic Engine**: Compute body burden ($B(t)$), blood concentration ($C_{ss}$), clearance rate ($CL$), and steady-state kinetics.
- [x] **Interactive Visualizations**: Recharts-powered histogram, box plot quantile summaries, cumulative distribution (CDF), convergence curves, and Spearman rank tornado plot.
- [x] **Statistical Analysis & Sensitivity Engine**: Calculate mean, median, standard deviation, variance, percentiles ($P_5, P_{25}, P_{75}, P_{95}$), 95% confidence intervals, and Spearman rank parameter sensitivity.
- [x] **Methodology Comparison Mode**: Head-to-head performance analysis (runtime in ms, variance, convergence rate, CI bounds).
- [x] **Scenario Presets Library**: Tailored environmental and physiological profiles for Filipino demographic cohorts (Average Filipino Woman, Urban Manila Resident, High Coastal Seafood Diet, Pregnant Female Profile).
- [x] **Data Export**: Export results to CSV, JSON, and visual scientific metrics.

---

## Tech Stack
| Technology | Description / Purpose |
| :--- | :--- |
| **React 19** | UI components & concurrent rendering engine |
| **TypeScript** | Strict static typing and mathematical domain safety |
| **Vite** | Next-generation frontend build tooling and HMR |
| **TailwindCSS** | Utility-first styling with modern glassmorphic theme design |
| **Zustand** | Lightweight, reactive state management store |
| **React Router** | Single-page application routing |
| **Recharts** | Declarative data visualization charts for scientific metrics |
| **Framer Motion** | Fluid animations and UI micro-interactions |
| **math.js** | Precise mathematical computations and statistical helper algorithms |
| **Lucide React** | Modern scientific icon set |

---

## Folder Structure
```
src/
├── app/          # App entry and global providers
├── assets/       # Static media and design assets
├── components/   # Generic reusable UI primitives (cards, inputs, buttons)
├── features/     # Feature-based domains
│   ├── playground/   # Parameter controls & main dashboard layout
│   ├── simulation/   # Toxicokinetic & sampling engine UI integration
│   ├── scenarios/    # Preset demographic profiles
│   ├── statistics/   # Statistical summaries & percentile tables
│   └── charts/       # Interactive scientific charts
├── hooks/        # Custom React hooks
├── layouts/      # Main application frame layout (Header, Nav, Footer)
├── pages/        # Route views (Home, Playground, Compare, Documentation)
├── simulation/   # Core scientific math algorithms (MC, LHS, Toxicokinetics)
├── stores/       # Zustand store declarations
├── types/        # TypeScript models, parameter schemas & statistical types
├── utils/        # Mathematical & formatting helper utilities
└── workers/      # Web Workers for asynchronous simulation execution
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

### Toxicokinetic Model (1-Compartment)
The steady-state blood concentration ($C_{ss}$) and time-dependent body burden ($B(t)$) are modeled as:

$$C_{ss} = \frac{I \times f_{abs}}{BW \times k_e}$$

where:
- $I$: Daily PFAS intake ($\mu g/\text{day}$)
- $f_{abs}$: Bioavailability / Gastrointestinal absorption fraction
- $BW$: Body weight ($\text{kg}$)
- $k_e$: First-order elimination rate constant ($\text{day}^{-1} = \frac{\ln(2)}{T_{1/2}}$)
- $T_{1/2}$: Biological elimination half-life ($\text{days}$ or $\text{years}$)

---

## License
MIT License - see `LICENSE` for details.
