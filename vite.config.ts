import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ManifestV3Export, crx } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'twitter-ar-blocker',
  version: '0.0.1',
  action: {
    default_popup: 'src/popup/index.html',
  },
  devtools_page: 'src/devtools/index.html',

  permissions: ['webRequest', 'debugger', 'tabs'],
  host_permissions: ['https://twitter.com/*', 'https://x.com/*'],
  content_scripts: [
    {
      matches: ['https://twitter.com/*', 'https://x.com/*'],
      js: ['src/contentScripts/entrypoint.ts'],
    },
  ],
  // background: {
  //   // service_worker: 'service-worker-loader.js',
  //   // type: 'module',
  //   service_worker: 'src/background/index.ts',
  // },
};

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest,
    }),
  ],
});
