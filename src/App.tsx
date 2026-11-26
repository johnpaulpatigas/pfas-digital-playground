import { App as CapApp } from '@capacitor/app';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';

const loadPlaygroundPage = () =>
  import('./pages/PlaygroundPage').then((m) => ({ default: m.PlaygroundPage }));

const PlaygroundPage = lazy(loadPlaygroundPage);

function warmPlayground() {
  void loadPlaygroundPage().catch(() => {});
  void import('./simulation/runSimulationAsync')
    .then(({ prewarmSimulationWorker }) => prewarmSimulationWorker())
    .catch(() => {});
}
const ComparePage = lazy(() =>
  import('./pages/ComparePage').then((m) => ({ default: m.ComparePage })),
);
const DocsPage = lazy(() => import('./pages/DocsPage').then((m) => ({ default: m.DocsPage })));
const ScientificGuidePage = lazy(() =>
  import('./pages/ScientificGuidePage').then((m) => ({ default: m.ScientificGuidePage })),
);

function BackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const listener = CapApp.addListener('backButton', () => {
      if (location.pathname !== '/') {
        navigate(-1);
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      listener.then((handler) => handler.remove());
    };
  }, [location, navigate]);

  return null;
}

function PageLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.06 } }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className="flex-1 flex flex-col w-full"
    >
      <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/playground') return;

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(warmPlayground, { timeout: 1000 });
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(warmPlayground, 250);
    return () => window.clearTimeout(handle);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <HomePage />
            </PageWrapper>
          }
        />
        <Route
          path="/playground"
          element={
            <PageWrapper>
              <PlaygroundPage />
            </PageWrapper>
          }
        />
        <Route
          path="/compare"
          element={
            <PageWrapper>
              <ComparePage />
            </PageWrapper>
          }
        />
        <Route
          path="/docs"
          element={
            <PageWrapper>
              <DocsPage />
            </PageWrapper>
          }
        />
        <Route
          path="/guide"
          element={
            <PageWrapper>
              <ScientificGuidePage />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(console.error);

      if (Capacitor.getPlatform() === 'android') {
        EdgeToEdge.enable()
          .then(() => {
            return Promise.all([
              EdgeToEdge.setStatusBarColor({ color: '#ffffff' }),
              EdgeToEdge.setNavigationBarColor({ color: '#ffffff' }),
            ]);
          })
          .catch((err) => {
            console.error('EdgeToEdge initialization error:', err);
          });
      }
    }
  }, []);

  return (
    <HashRouter>
      <BackButtonHandler />
      <MainLayout>
        <AnimatedRoutes />
      </MainLayout>
    </HashRouter>
  );
}

export default App;
