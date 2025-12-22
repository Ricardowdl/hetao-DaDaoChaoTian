import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  define: {
    __VUE_PROD_DEVTOOLS__: false
  },
  esbuild: {
    drop: mode === 'development' ? [] : ['console', 'debugger']
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/official': {
        target: 'http://43.160.245.153',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/official/, '')
      },
      '/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/deepseek/, '')
      }
    }
  }
}))
