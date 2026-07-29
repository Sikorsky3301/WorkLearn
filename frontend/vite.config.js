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
})
