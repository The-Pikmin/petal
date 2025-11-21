import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.greeneye.app',
  appName: 'GreenEye',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    }
  },
  ios: {
    // contentInset: 'always' - Removed to prevent double padding with viewport-fit=cover
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;
