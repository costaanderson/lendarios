import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Na Vercel, as variáveis de ambiente vêm do process.env
    // Tenta: process.env primeiro (Vercel), depois env (arquivo .env local)
    const viteUseRealApi = process.env.VITE_USE_REAL_API === 'true' || env.VITE_USE_REAL_API === 'true' ? 'true' : 'false';
    
    console.log('[VITE CONFIG] process.env.VITE_USE_REAL_API:', process.env.VITE_USE_REAL_API);
    console.log('[VITE CONFIG] env.VITE_USE_REAL_API:', env.VITE_USE_REAL_API);
    console.log('[VITE CONFIG] Final viteUseRealApi:', viteUseRealApi);
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_USE_REAL_API': JSON.stringify(viteUseRealApi)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
