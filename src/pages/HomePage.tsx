import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu, Network, ArrowRight, Layers, CheckCircle2, FlaskConical, GraduationCap } from 'lucide-react';
import { MathView } from '../components/ui/MathView';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl p-8 sm:p-10 bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-medium">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Environmental health and toxicokinetics</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight font-heading">
            PFAS toxicokinetic modeling <br />
            <span className="text-blue-700">Exposure and risk simulation</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Simulate chemical exposure uncertainty and bioaccumulation of per- and polyfluoroalkyl substances (PFAS)
            among <strong>Filipino women</strong> using 1-compartment toxicokinetics, 
            <strong> Monte Carlo simulation</strong>, and <strong>Latin hypercube sampling</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/playground"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <span>Open interactive playground</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-all"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Compare MC vs LHS</span>
            </Link>

            <Link
              to="/guide"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-all"
            >
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>Scientific guide</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Target PFAS Compound Library Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 font-heading">Target PFAS chemicals</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">US EPA and EFSA guidance baselines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          {PFAS_COMPOUNDS.map((c) => (
            <div key={c.id} className="card-panel p-3.5 rounded-xl space-y-1.5">
              <div className="text-slate-900 font-bold text-xs">{c.name.split(' ')[0]}</div>
              <div className="text-slate-500 text-[11px]">
                <MathView math={c.chemicalFormula} />
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Half-life:</span>
                  <span className="font-bold text-teal-700">{c.halfLifeYears} yrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">EPA MCL:</span>
                  <span className="font-bold text-blue-700">{c.epaMCL} ng/L</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Scientific Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'PFAS chemicals',
            icon: ShieldAlert,
            color: 'text-amber-600',
            desc: 'Synthetic chemicals with long elimination half-lives in human blood serum and tissues.',
          },
          {
            title: 'Toxicokinetics (TK)',
            icon: Cpu,
            color: 'text-blue-600',
            desc: 'Models oral absorption, volume of distribution, clearance rate, and steady-state serum concentration.',
          },
          {
            title: 'Monte Carlo sampling',
            icon: Network,
            color: 'text-teal-600',
            desc: 'Pseudo-random sampling across parameter distributions to generate population risk distributions.',
          },
          {
            title: 'Latin hypercube sampling',
            icon: Layers,
            color: 'text-purple-600',
            desc: 'Stratified sampling that covers parameter ranges evenly with fewer iterations.',
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-xl card-panel space-y-2.5"
            >
              <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{item.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Demographic Context Section */}
      <section className="card-panel rounded-2xl p-7 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          <span className="text-xs font-mono text-blue-700 uppercase tracking-widest font-semibold">
            Cohort focus
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Why probabilistic modeling matters for Filipino women
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Deterministic safety assessments use single fixed values, such as average body weight or mean intake.
            That hides biological variation. In practice, exposure differs based on local drinking water levels,
            dietary habits (such as coastal seafood intake), and physiological changes during pregnancy.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-sans">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Accounts for physiological differences, such as lower median body weight and specific half-lives.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Evaluates high-risk percentiles (<MathView math="P_{95}" />, <MathView math="P_{99}" />) for upper-tail exposures.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Ranks exposure drivers using Spearman rank correlation (<MathView math="\rho" />).</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 font-mono text-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold">Parameter</span>
            <span className="text-slate-500 font-bold">Distribution Type</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Daily Intake (<MathView math="I" />)</span>
            <span className="text-amber-800 font-semibold">Lognormal (<MathView math="\mu, \sigma" />)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Body Weight (<MathView math="BW" />)</span>
            <span className="text-teal-800 font-semibold">Normal (55.4 kg, 8.2)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Water Consumption (<MathView math="V_w" />)</span>
            <span className="text-blue-800 font-semibold">Triangular (1.2, 2.0, 3.5 L)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Half-life (<MathView math="T_{1/2}" />)</span>
            <span className="text-purple-800 font-semibold">Lognormal (3.8 yrs)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
