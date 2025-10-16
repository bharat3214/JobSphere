# JobSphere

A modern job portal connecting talented job seekers with leading companies. Built with vanilla JavaScript, Vite, and Supabase.

## Features

- **For Job Seekers:**
  - Browse and search job listings
  - Apply to jobs with one click
  - Track application status
  - Skill-based job recommendations
  - Profile management

- **For Companies:**
  - Post job listings
  - Manage applications
  - Smart filtering by skills
  - Application status tracking
  - Applicant management

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Build Tool:** Vite
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Supabase account and project
- Git

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/JobSphere.git
   cd JobSphere
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit .env and add your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Setup Supabase Database:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL migrations in your Supabase SQL editor:
     ```sql
     -- Run the contents of supabase/migrations/20251016154043_create_jobsphere_schema.sql
     -- Then run supabase/migrations/20251016154528_add_sample_data.sql
     ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## Deployment to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
   Enter your Supabase credentials when prompted.

### Method 2: Vercel Web Interface

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Deploy:**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

## Project Structure

```
JobSphere/
├── public/               # Static assets
├── supabase/
│   └── migrations/       # Database schema and sample data
├── index.html           # Landing page redirect
├── jobsphere.html       # Main landing page
├── jobseeker.html       # Job seeker dashboard
├── company.html         # Company dashboard
├── jobsphere.js         # Main app logic
├── jobseeker.js         # Job seeker functionality
├── company.js           # Company functionality
├── jobsphere.css        # Global styles
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── vercel.json          # Vercel deployment config
└── README.md           # This file
```

## Database Schema

The application uses three main tables:

- **profiles**: User accounts (both job seekers and companies)
- **jobs**: Job postings created by companies
- **applications**: Job applications from seekers to companies

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Troubleshooting

### Common Issues

1. **"Application configuration error"**
   - Check if your `.env` file exists and contains the correct Supabase credentials
   - Ensure environment variable names start with `VITE_`
   - Restart the development server after adding environment variables

2. **Build fails on Vercel**
   - Ensure all environment variables are set in Vercel dashboard
   - Check that your Supabase project is accessible
   - Verify the build command is set to `npm run build`

3. **Database connection issues**
   - Verify your Supabase URL and keys are correct
   - Check if your Supabase project is active
   - Ensure Row Level Security policies are properly configured

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Contact the development team

---

Built with ❤️ by the JobSphere team
