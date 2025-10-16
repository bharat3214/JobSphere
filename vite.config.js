import { defineConfig } from 'vite'

export default defineConfig({
  // Configure for multi-page application
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        jobsphere: 'jobsphere.html',
        jobseeker: 'jobseeker.html',
        company: 'company.html'
      }
    }
  },
  // Environment variables are automatically handled by Vite
  // No need to manually define them here
  server: {
    port: 3000
  }
})