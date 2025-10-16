/*
  # JobSphere Database Schema

  ## Overview
  Creates the complete database structure for JobSphere - a job portal combining LinkedIn and Internshala features.

  ## New Tables

  ### 1. profiles
  Stores user profile information for both job seekers and companies
  - `id` (uuid, primary key) - Links to auth.users
  - `user_type` (text) - Either 'jobseeker' or 'company'
  - `full_name` (text) - User's full name
  - `email` (text) - User's email address
  - `skills` (text array) - For job seekers: their skills
  - `experience` (text) - Job seeker's experience description
  - `company_name` (text) - For companies: company name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. jobs
  Stores job postings created by companies
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key) - References profiles table
  - `title` (text) - Job title
  - `description` (text) - Job description
  - `required_skills` (text array) - Skills required for the job
  - `location` (text) - Job location
  - `job_type` (text) - Full-time, Part-time, Internship, etc.
  - `created_at` (timestamptz) - Job posting timestamp
  - `is_active` (boolean) - Whether job is still accepting applications

  ### 3. applications
  Tracks job applications from seekers to companies
  - `id` (uuid, primary key)
  - `job_id` (uuid, foreign key) - References jobs table
  - `applicant_id` (uuid, foreign key) - References profiles table
  - `status` (text) - Applied, Shortlisted, In Review, Rejected, Accepted
  - `applied_at` (timestamptz) - Application submission timestamp
  - `updated_at` (timestamptz) - Last status update timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Profiles: Users can view all profiles but only update their own
  - Jobs: Anyone can view active jobs, only companies can create/update their own jobs
  - Applications: Job seekers can view their own applications, companies can view applications for their jobs
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL CHECK (user_type IN ('jobseeker', 'company')),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  skills text[] DEFAULT '{}',
  experience text DEFAULT '',
  company_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  required_skills text[] DEFAULT '{}',
  location text DEFAULT 'Remote',
  job_type text DEFAULT 'Full-time',
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'In Review', 'Rejected', 'Accepted')),
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Jobs policies
CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  USING (is_active = true OR company_id IN (
    SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Companies can insert their own jobs"
  ON jobs FOR INSERT
  WITH CHECK (company_id IN (
    SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND user_type = 'company'
  ));

CREATE POLICY "Companies can update their own jobs"
  ON jobs FOR UPDATE
  USING (company_id IN (
    SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Applications policies
CREATE POLICY "Job seekers can view their own applications"
  ON applications FOR SELECT
  USING (
    applicant_id IN (SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR 
    job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
  );

CREATE POLICY "Job seekers can create applications"
  ON applications FOR INSERT
  WITH CHECK (applicant_id IN (
    SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND user_type = 'jobseeker'
  ));

CREATE POLICY "Companies can update application status"
  ON applications FOR UPDATE
  USING (job_id IN (
    SELECT id FROM jobs WHERE company_id IN (SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  ))
  WITH CHECK (job_id IN (
    SELECT id FROM jobs WHERE company_id IN (SELECT id FROM profiles WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);