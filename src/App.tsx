import React, { useEffect, useLayoutEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ComparePage } from './pages/ComparePage';
import { DocsPage } from './pages/DocsPage';
import { ScientificGuidePage } from './pages/ScientificGuidePage';

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

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="flex-1 flex flex-col w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
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
