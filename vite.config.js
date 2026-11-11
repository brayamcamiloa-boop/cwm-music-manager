const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        website: 'website.html',
      },
    },
  },
});
