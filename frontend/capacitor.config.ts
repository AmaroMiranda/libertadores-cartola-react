import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amaro.libertadores',
  appName: 'Libertadores do Cartola',
  webDir: 'build',
  

  server: {

    url: 'https://cartola-libertadors.onrender.com', 
    

    cleartext: true
  }
};

export default config;