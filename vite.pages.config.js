const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  base: '/cwm-music-manager/',
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        website: 'website.html',
      },
    },
  },
});
