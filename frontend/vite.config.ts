import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.wasm', '**/*.zkey'],
  define: {
    global: 'globalThis',
    // 'process.env.NODE_DEBUG': undefined
  },
  resolve: {
    alias: {
      process: 'process/browser',
      util: 'util',
    },
  },
  plugins: [react()],
  optimizeDeps: { exclude: ["fsevents", "@nomicfoundation/solidity-analyzer-darwin-arm64"] },
})
