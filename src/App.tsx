import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ComparePage } from './pages/ComparePage';
import { DocsPage } from './pages/DocsPage';

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
}

export default App;
