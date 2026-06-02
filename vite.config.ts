import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the same build works inside the Capacitor APK (served from
// the app root) AND on GitHub Pages (served from /vibecall/). An absolute
// '/vibecall/' base breaks the native webview -> white screen.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './'
})
