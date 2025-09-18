import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edusphere.app',
  appName: 'EduSphere',
  webDir: 'out', // Use 'out' for static exports
  server: {
    androidScheme: 'https', // ✅ required for Android to load files properly
  },
};

export default config;
