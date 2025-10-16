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
  // Ensure proper handling of environment variables
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
  }
})