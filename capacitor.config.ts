import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.johnpaulpatigas.pfasdigitalplayground',
  appName: 'PFAS Digital Playground',
  webDir: 'dist',
  plugins: {
    EdgeToEdge: {
      backgroundColor: "#ffffff",
      navigationBarColor: "#ffffff",
      statusBarColor: "#ffffff",
    },
    SystemBars: {
      insetsHandling: "disable",
      style: "LIGHT",
    },
  },
};

export default config;
