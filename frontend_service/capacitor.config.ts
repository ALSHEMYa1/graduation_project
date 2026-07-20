import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asa.study',
  appName: 'ASA',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    cleartext: true,
  },
};

export default config;
