import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // .lottie files (dotLottie zip containers, e.g. the AI Mentor's thinking
  // animation) aren't in Vite's default asset-extension list — without this
  // an `import x from './foo.lottie'` fails to resolve as a URL.
  assetsInclude: ['**/*.lottie'],
  server: {
    host: '127.0.0.1',
    strictPort: true,
  },
  test: {
    // happy-dom, not jsdom: the jsdom 27 currently on npm pulls in
    // @asamuzakjp/css-color, which require()s an ESM-only @csstools
    // package and crashes every worker before a single test runs
    // (ERR_REQUIRE_ESM) — happy-dom gives the same DOM-in-Node environment
    // Testing Library needs without that broken dependency chain.
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
