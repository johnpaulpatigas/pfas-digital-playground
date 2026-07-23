import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Compass, BookOpen, Layers, Dna } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: Compass },
    { path: '/playground', label: 'Playground', icon: Activity },
    { path: '/compare', label: 'MC vs LHS Compare', icon: Layers },
    { path: '/docs', label: 'Methodology & Math', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Dna className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 font-heading tracking-tight">
                PFAS Toxicokinetic Playground
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Filipino Cohort v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono hidden sm:block">
              Probabilistic Risk Engine • Monte Carlo Simulation &amp; Latin Hypercube Sampling
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-700 font-semibold">Research Computing Engine Ready</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Target Cohort: Filipino Women Environmental Exposure</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Monte Carlo &amp; LHS Simulation Platform</span>
          <span>•</span>
          <Link to="/docs" className="hover:text-blue-600 transition-colors">
            Methodology Documentation
          </Link>
        </div>
      </footer>
    </div>
  );
};
