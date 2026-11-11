const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  base: '/desktop-tutorial/',
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        website: 'website.html',
      },
    },
  },
});
