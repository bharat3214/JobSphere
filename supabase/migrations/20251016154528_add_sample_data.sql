/*
  # Add Sample Data for JobSphere

  ## Overview
  Populates the database with sample data for demonstration purposes

  ## Sample Data Added

  ### 1. Sample Profiles
  - 2 Job Seekers with different skill sets
  - 2 Companies

  ### 2. Sample Jobs
  - 4 job postings from the sample companies
  - Various positions requiring different skills

  ### 3. Sample Applications
  - A few applications from job seekers to demonstrate the application tracking feature

  ## Notes
  - This migration is idempotent and can be run multiple times
  - Sample passwords are 'password123' for all test accounts
*/

-- Insert sample job seekers (only if they don't exist)
INSERT INTO profiles (id, user_type, full_name, email, skills, experience)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'jobseeker',
    'Sarah Johnson',
    'sarah.j@example.com',
    ARRAY['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
    '3 years of experience as a Full Stack Developer. Worked on multiple SaaS products and e-commerce platforms.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'jobseeker',
    'Michael Chen',
    'michael.c@example.com',
    ARRAY['Python', 'Django', 'Machine Learning', 'Data Analysis', 'SQL'],
    '5 years of experience in backend development and data engineering. Strong background in AI/ML projects.'
  )
ON CONFLICT (email) DO NOTHING;

-- Insert sample companies (only if they don't exist)
INSERT INTO profiles (id, user_type, full_name, email, company_name)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333',
    'company',
    'John Smith',
    'hr@techcorp.example.com',
    'TechCorp Solutions'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'company',
    'Emma Williams',
    'recruit@innovate.example.com',
    'Innovate Labs'
  )
ON CONFLICT (email) DO NOTHING;

-- Insert sample jobs (only if they don't exist)
INSERT INTO jobs (id, company_id, title, description, required_skills, location, job_type)
VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'Senior Full Stack Developer',
    'We are looking for an experienced Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern JavaScript frameworks and Node.js. Strong knowledge of React and TypeScript is required.',
    ARRAY['JavaScript', 'React', 'Node.js', 'TypeScript'],
    'Remote',
    'Full-time'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'Frontend Developer (Internship)',
    'Join our team as a Frontend Development Intern! Perfect opportunity for students or recent graduates to gain hands-on experience with modern web technologies. You will work on real projects and learn from experienced developers.',
    ARRAY['HTML', 'CSS', 'JavaScript', 'React'],
    'Hybrid',
    'Internship'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '44444444-4444-4444-4444-444444444444',
    'Python Backend Engineer',
    'Innovate Labs is seeking a talented Python Backend Engineer to build scalable APIs and microservices. You will work with Django, Flask, and modern cloud infrastructure. Experience with data processing and ML pipelines is a plus.',
    ARRAY['Python', 'Django', 'SQL', 'AWS'],
    'On-site',
    'Full-time'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'Data Analyst',
    'We need a detail-oriented Data Analyst to help us make data-driven decisions. You will be working with large datasets, creating reports, and building dashboards. Strong SQL skills and experience with Python data libraries required.',
    ARRAY['Python', 'SQL', 'Data Analysis', 'Excel'],
    'Remote',
    'Part-time'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample applications (only if they don't exist)
INSERT INTO applications (id, job_id, applicant_id, status)
VALUES 
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Shortlisted'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    'In Review'
  )
ON CONFLICT (job_id, applicant_id) DO NOTHING;