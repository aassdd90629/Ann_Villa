import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Cloudflare Pages 預設部署於根目錄 '/'；若仍需 GitHub Pages 次目錄可透過環境變數 VITE_BASE_PATH 指定
const base = process.env.VITE_BASE_PATH || '/'

// 解決次目錄部署時，JSON 資料內靜態圖片路徑自動加上 base 的問題
function prefixPublicPathPlugin() {
  return {
    name: 'prefix-public-path',
    transform(code, id) {
      if (id.endsWith('.json') && base !== '/') {
        return code.replaceAll('"/img/', `"${base}img/`)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), prefixPublicPathPlugin()],
  server: {
    host: true, // 自動暴露內網 IP (0.0.0.0)，同網域/手機皆可直接存取預覽
    port: 5173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use "@/assets/styles/variables.scss" as *;`,
      },
    },
  },
})
