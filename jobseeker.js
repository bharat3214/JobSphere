import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  alert('Application configuration error. Please contact support.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let allJobs = [];
let allApplications = [];
let currentJobToApply = null;

async function checkAuth() {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) {
    window.location.href = 'jobsphere.html';
    return;
  }

  currentUser = JSON.parse(userStr);
  if (currentUser.user_type !== 'jobseeker') {
    window.location.href = 'company.html';
    return;
  }

  document.getElementById('userName').textContent = currentUser.full_name;
  loadDashboard();
}

async function loadDashboard() {
  await loadApplicationStats();
  await loadRecommendedJobs();
}

async function loadApplicationStats() {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .eq('applicant_id', currentUser.id);

    if (error) throw error;

    allApplications = applications || [];

    const appliedCount = applications.length;
    const reviewCount = applications.filter(app => app.status === 'In Review').length;
    const shortlistedCount = applications.filter(app => app.status === 'Shortlisted').length;

    document.getElementById('appliedCount').textContent = appliedCount;
    document.getElementById('reviewCount').textContent = reviewCount;
    document.getElementById('shortlistedCount').textContent = shortlistedCount;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecommendedJobs() {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        profiles:company_id (full_name, company_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allJobs = jobs || [];

    const userSkills = currentUser.skills || [];
    const recommendedJobs = jobs.filter(job => {
      const requiredSkills = job.required_skills || [];
      return requiredSkills.some(skill =>
        userSkills.some(userSkill =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
    }).slice(0, 4);

    displayJobs(recommendedJobs, 'recommendedJobs');
  } catch (error) {
    console.error('Error loading jobs:', error);
    document.getElementById('recommendedJobs').innerHTML = '<p class="empty-state">Error loading jobs</p>';
  }
}

function displayJobs(jobs, containerId) {
  const container = document.getElementById(containerId);

  if (jobs.length === 0) {
    container.innerHTML = '<div class="empty-state"><h2>No jobs found</h2><p>Check back later for new opportunities</p></div>';
    return;
  }

  container.innerHTML = jobs.map(job => {
    const companyName = job.profiles?.company_name || job.profiles?.full_name || 'Company';
    const alreadyApplied = allApplications.some(app => app.job_id === job.id);

    return `
      <div class="job-card">
        <h3>${job.title}</h3>
        <p class="company-name">${companyName}</p>
        <p class="location">${job.location} • ${job.job_type}</p>
        <div class="skills-container">
          ${(job.required_skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
        <p style="color: var(--text-light); margin: 1rem 0;">${job.description.substring(0, 150)}...</p>
        ${alreadyApplied
          ? '<button class="btn btn-secondary btn-sm" disabled>Already Applied</button>'
          : `<button class="btn btn-primary btn-sm" onclick="openApplyModal('${job.id}')">Apply Now</button>`
        }
      </div>
    `;
  }).join('');
}

async function showBrowseJobs() {
  document.getElementById('mainContent').classList.add('hidden');
  document.getElementById('applicationsContent').classList.add('hidden');
  document.getElementById('profileContent').classList.add('hidden');
  document.getElementById('browseJobsContent').classList.remove('hidden');

  if (allJobs.length === 0) {
    await loadRecommendedJobs();
  }

  displayJobs(allJobs, 'allJobsList');
}

function filterJobs() {
  const searchTerm = document.getElementById('jobSearchInput').value.toLowerCase();
  const jobType = document.getElementById('jobTypeFilter').value;
  const location = document.getElementById('locationFilter').value;

  const filtered = allJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm) ||
                         (job.profiles?.company_name || '').toLowerCase().includes(searchTerm);
    const matchesType = !jobType || job.job_type === jobType;
    const matchesLocation = !location || job.location === location;

    return matchesSearch && matchesType && matchesLocation;
  });

  displayJobs(filtered, 'allJobsList');
}

async function showApplications() {
  document.getElementById('mainContent').classList.add('hidden');
  document.getElementById('browseJobsContent').classList.add('hidden');
  document.getElementById('profileContent').classList.add('hidden');
  document.getElementById('applicationsContent').classList.remove('hidden');

  await loadMyApplications();
}

async function loadMyApplications() {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          *,
          profiles:company_id (full_name, company_name)
        )
      `)
      .eq('applicant_id', currentUser.id)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    allApplications = applications || [];
    displayApplications(applications);
  } catch (error) {
    console.error('Error loading applications:', error);
    document.getElementById('applicationsList').innerHTML = '<p class="empty-state">Error loading applications</p>';
  }
}

function displayApplications(applications) {
  const container = document.getElementById('applicationsList');

  if (applications.length === 0) {
    container.innerHTML = '<div class="empty-state"><h2>No applications yet</h2><p>Start applying to jobs to see them here</p></div>';
    return;
  }

  container.innerHTML = applications.map(app => {
    const job = app.jobs;
    const companyName = job.profiles?.company_name || job.profiles?.full_name || 'Company';
    const appliedDate = new Date(app.applied_at).toLocaleDateString();

    return `
      <div class="application-card">
        <div class="application-header">
          <div>
            <h3>${job.title}</h3>
            <p class="company-name">${companyName}</p>
          </div>
          <span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span>
        </div>
        <p style="color: var(--text-light); margin-bottom: 0.5rem;">Applied on: ${appliedDate}</p>
        <p style="color: var(--text-light);">${job.location} • ${job.job_type}</p>
      </div>
    `;
  }).join('');
}

function filterApplications() {
  const status = document.getElementById('statusFilter').value;

  const filtered = status
    ? allApplications.filter(app => app.status === status)
    : allApplications;

  displayApplications(filtered);
}

function showProfile() {
  document.getElementById('mainContent').classList.add('hidden');
  document.getElementById('browseJobsContent').classList.add('hidden');
  document.getElementById('applicationsContent').classList.add('hidden');
  document.getElementById('profileContent').classList.remove('hidden');

  document.getElementById('profileName').value = currentUser.full_name;
  document.getElementById('profileEmail').value = currentUser.email;
  document.getElementById('profileSkills').value = (currentUser.skills || []).join(', ');
  document.getElementById('profileExperience').value = currentUser.experience || '';
}

async function updateProfile(event) {
  event.preventDefault();

  const fullName = document.getElementById('profileName').value;
  const skillsStr = document.getElementById('profileSkills').value;
  const experience = document.getElementById('profileExperience').value;

  const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        skills: skills,
        experience: experience,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) throw error;

    currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(data));

    const successDiv = document.getElementById('profileSuccess');
    successDiv.textContent = 'Profile updated successfully!';
    successDiv.classList.remove('hidden');

    setTimeout(() => successDiv.classList.add('hidden'), 3000);
  } catch (error) {
    alert('Error updating profile: ' + error.message);
  }
}

function openApplyModal(jobId) {
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return;

  currentJobToApply = job;

  const companyName = job.profiles?.company_name || job.profiles?.full_name || 'Company';

  document.getElementById('applyJobDetails').innerHTML = `
    <div class="job-card">
      <h3>${job.title}</h3>
      <p class="company-name">${companyName}</p>
      <p class="location">${job.location} • ${job.job_type}</p>
      <div class="skills-container">
        ${(job.required_skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
      <p style="margin-top: 1rem;">${job.description}</p>
    </div>
  `;

  document.getElementById('applyModal').classList.add('active');
  document.getElementById('applySuccess').classList.add('hidden');
  document.getElementById('applyError').classList.add('hidden');
}

async function submitApplication() {
  if (!currentJobToApply) return;

  try {
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        job_id: currentJobToApply.id,
        applicant_id: currentUser.id,
        status: 'Applied'
      }])
      .select()
      .single();

    if (error) throw error;

    const successDiv = document.getElementById('applySuccess');
    successDiv.textContent = 'Application submitted successfully!';
    successDiv.classList.remove('hidden');

    allApplications.push(data);

    setTimeout(() => {
      closeModal('applyModal');
      loadDashboard();
    }, 1500);
  } catch (error) {
    const errorDiv = document.getElementById('applyError');
    errorDiv.textContent = error.message.includes('duplicate')
      ? 'You have already applied to this job'
      : 'Error submitting application: ' + error.message;
    errorDiv.classList.remove('hidden');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  supabase.auth.signOut();
  window.location.href = 'jobsphere.html';
}

window.showBrowseJobs = showBrowseJobs;
window.showApplications = showApplications;
window.showProfile = showProfile;
window.filterJobs = filterJobs;
window.filterApplications = filterApplications;
window.updateProfile = updateProfile;
window.openApplyModal = openApplyModal;
window.submitApplication = submitApplication;
window.closeModal = closeModal;
window.handleLogout = handleLogout;

checkAuth();