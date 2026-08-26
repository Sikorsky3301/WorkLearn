import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import lanUrlPlugin from './vite-lan-url.js'

// Where the FastAPI server is listening. Only the Vite process reads this — it
// never reaches the browser — so loopback is correct here even when the site
// is being served to other machines. Override with BACKEND_ORIGIN when the API
// runs somewhere else.
const BACKEND = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:3001'

export default defineConfig({
  plugins: [react(), lanUrlPlugin()],
  // .lottie files (dotLottie zip containers, e.g. the AI Mentor's thinking
  // animation) aren't in Vite's default asset-extension list — without this
  // an `import x from './foo.lottie'` fails to resolve as a URL.
  assetsInclude: ['**/*.lottie'],
  server: {
    // true so partner hosts like iitd.localhost:5173 resolve (not only
    // 127.0.0.1), AND so the dev server is reachable from other devices on the
    // network rather than loopback only.
    host: true,
    strictPort: true,

    // ── Why the API is proxied rather than called directly ────────────────
    //
    // The browser used to call VITE_API_URL, which was pinned to
    // http://127.0.0.1:3001. That works on the machine running the servers and
    // nowhere else: open the site from a phone at http://192.168.1.x:5173 and
    // the phone dials ITS OWN 127.0.0.1:3001, finds nothing, and every request
    // fails with "We can't reach WorkLearn right now."
    //
    // Even pointing it at the LAN IP would not have been enough — the backend's
    // CORS allow-list is FRONTEND_URL plus a regex that only matches
    // `localhost`, so an origin like http://192.168.1.x:5173 is refused.
    //
    // Proxying removes both problems at once: the page calls its OWN origin
    // (`/api/...`), Vite forwards it to the backend server-side, and there is
    // no cross-origin request left for CORS to have an opinion about. It works
    // unchanged from localhost, from a partner subdomain, and from any device
    // on the network.
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      // Uploaded logos, manager photos and sim banners are served from here.
      '/static': { target: BACKEND, changeOrigin: true },
    },
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
