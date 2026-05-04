import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/wedding-invite/',
  server: {
    allowedHosts: true, // 보안상 모든 외부 호스트(도메인)의 접근을 허용합니다.
  },
  build: {
    chunkSizeWarningLimit: 1000, // 패키지 용량 경고 기준을 1000kb로 늘립니다.
  }
})
