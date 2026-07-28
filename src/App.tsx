import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
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
