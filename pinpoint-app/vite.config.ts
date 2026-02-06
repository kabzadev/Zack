import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.existsSync('/tmp/ssl/key.pem') ? fs.readFileSync('/tmp/ssl/key.pem') : undefined,
      cert: fs.existsSync('/tmp/ssl/cert.pem') ? fs.readFileSync('/tmp/ssl/cert.pem') : undefined,
    },
    allowedHosts: ['100.88.213.43', 'localhost'],
    cors: true,
  }
})
