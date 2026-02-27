import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-gifs',
      configureServer(server) {
        const gifsDir = path.resolve(__dirname, '../docs/gifs')
        server.middlewares.use('/gifs', (req, res, next) => {
          const file = path.join(gifsDir, req.url)
          if (fs.existsSync(file)) {
            res.setHeader('Content-Type', 'image/gif')
            fs.createReadStream(file).pipe(res)
          } else next()
        })
      },
    },
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
