import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  alert('Application configuration error. Please contact support.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let allApplications = [];
let filteredApplications = [];
let myJobs = [];

async function checkAuth() {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) {
    window.location.href = 'jobsphere.html';
    return;
  }

  currentUser = JSON.parse(userStr);
  if (currentUser.user_type !== 'company') {
    window.location.href = 'jobseeker.html';
    return;
  }

  document.getElementById('companyName').textContent = currentUser.company_name || currentUser.full_name;
  loadDashboard();
}

async function loadDashboard() {
  await loadStats();
}

async function loadStats() {
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', currentUser.id)
      .eq('is_active', true);

    if (jobsError) throw jobsError;

    myJobs = jobs || [];

    const jobIds = jobs.map(job => job.id);

    let totalApplicants = 0;
    let pendingReview = 0;

    if (jobIds.length > 0) {
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('job_id', jobIds);

      if (appsError) throw appsError;

      totalApplicants = applications.length;
      pendingReview = applications.filter(app => app.status === 'Applied' || app.status === 'In Review').length;
    }

    document.getElementById('totalJobs').textContent = jobs.length;
    document.getElementById('totalApplicants').textContent = totalApplicants;
    document.getElementById('pendingReview').textContent = pendingReview;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function showApplicationsManager() {
  document.getElementById('mainContent').classList.add('hidden');
  document.getElementById('postJobContent').classList.add('hidden');
  document.getElementById('myJobsContent').classList.add('hidden');
  document.getElementById('applicationsContent').classList.remove('hidden');

  await loadApplications();
  populateJobFilter();
}

async function loadApplications() {
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', currentUser.id);

    if (jobsError) throw jobsError;

    const jobIds = jobs.map(job => job.id);

    if (jobIds.length === 0) {
      document.getElementById('applicantsList').innerHTML = '<div class="empty-state"><h2>No applications yet</h2><p>Post a job to start receiving applications</p></div>';
      return;
    }

    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (*),
        profiles:applicant_id (*)
      `)
      .in('job_id', jobIds)
      .order('applied_at', { ascending: false });

    if (appsError) throw appsError;

    allApplications = applications || [];
    filteredApplications = allApplications;
    displayApplications(filteredApplications);
  } catch (error) {
    console.error('Error loading applications:', error);
    document.getElementById('applicantsList').innerHTML = '<p class="empty-state">Error loading applications</p>';
  }
}

function populateJobFilter() {
  const select = document.getElementById('jobFilterSelect');
  select.innerHTML = '<option value="">All Jobs</option>';

  myJobs.forEach(job => {
    const option = document.createElement('option');
    option.value = job.id;
    option.textContent = job.title;
    select.appendChild(option);
  });
}

function displayApplications(applications) {
  const container = document.getElementById('applicantsList');

  if (applications.length === 0) {
    container.innerHTML = '<div class="empty-state"><h2>No applications found</h2><p>Try adjusting your filters</p></div>';
    return;
  }

  container.innerHTML = applications.map(app => {
    const applicant = app.profiles;
    const job = app.jobs;
    const appliedDate = new Date(app.applied_at).toLocaleDateString();

    const matchingSkills = (job.required_skills || []).filter(reqSkill =>
      (applicant.skills || []).some(appSkill =>
        appSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(appSkill.toLowerCase())
      )
    );

    const missingSkills = (job.required_skills || []).filter(reqSkill =>
      !(applicant.skills || []).some(appSkill =>
        appSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(appSkill.toLowerCase())
      )
    );

    return `
      <div class="application-card">
        <div class="application-header">
          <div class="applicant-info">
            <h3>${applicant.full_name}</h3>
            <p style="color: var(--text-light); margin: 0.25rem 0;">Applied for: ${job.title}</p>
            <p style="color: var(--text-light); font-size: 0.875rem;">Applied on: ${appliedDate}</p>
          </div>
          <div>
            <span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span>
          </div>
        </div>

        <div style="margin: 1rem 0;">
          <strong>Skills:</strong>
          <div class="skills-container" style="margin-top: 0.5rem;">
            ${(applicant.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>

        ${matchingSkills.length > 0 ? `
          <div style="margin: 1rem 0;">
            <strong style="color: var(--success);">Matching Skills:</strong>
            <div class="skills-container" style="margin-top: 0.5rem;">
              ${matchingSkills.map(skill => `<span class="skill-tag" style="background: var(--success); color: white;">${skill}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${missingSkills.length > 0 ? `
          <div style="margin: 1rem 0;">
            <strong style="color: var(--danger);">Missing Skills:</strong>
            <div class="skills-container" style="margin-top: 0.5rem;">
              ${missingSkills.map(skill => `<span class="skill-tag" style="background: var(--danger); color: white;">${skill}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${applicant.experience ? `
          <div style="margin: 1rem 0;">
            <strong>Experience:</strong>
            <p style="color: var(--text-light); margin-top: 0.5rem;">${applicant.experience.substring(0, 200)}${applicant.experience.length > 200 ? '...' : ''}</p>
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <select class="filter-select" id="status-${app.id}" onchange="updateApplicationStatus('${app.id}')">
            <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="In Review" ${app.status === 'In Review' ? 'selected' : ''}>In Review</option>
            <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
            <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            <option value="Accepted" ${app.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
          </select>
          <button class="btn btn-sm btn-primary" onclick="viewApplicantDetails('${app.id}')">View Details</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterApplicants() {
  const searchTerm = document.getElementById('applicantSearch').value.toLowerCase();
  const jobId = document.getElementById('jobFilterSelect').value;
  const status = document.getElementById('statusFilterSelect').value;

  filteredApplications = allApplications.filter(app => {
    const applicant = app.profiles;
    const matchesSearch = applicant.full_name.toLowerCase().includes(searchTerm) ||
                         (applicant.skills || []).some(skill => skill.toLowerCase().includes(searchTerm));
    const matchesJob = !jobId || app.job_id === jobId;
    const matchesStatus = !status || app.status === status;

    return matchesSearch && matchesJob && matchesStatus;
  });

  displayApplications(filteredApplications);
}

function autoFilterApplicants() {
  const filteredBySkills = allApplications.filter(app => {
    const applicant = app.profiles;
    const job = app.jobs;
    const requiredSkills = job.required_skills || [];
    const applicantSkills = applicant.skills || [];

    if (requiredSkills.length === 0) return true;

    const hasMatchingSkill = requiredSkills.some(reqSkill =>
      applicantSkills.some(appSkill =>
        appSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(appSkill.toLowerCase())
      )
    );

    return hasMatchingSkill;
  });

  filteredApplications = filteredBySkills;
  displayApplications(filteredApplications);

  const eliminatedCount = allApplications.length - filteredBySkills.length;
  if (eliminatedCount > 0) {
    alert(`Auto-filtered: ${eliminatedCount} applicant(s) eliminated due to missing required skills. Showing ${filteredBySkills.length} matching applicant(s).`);
  } else {
    alert('All applicants have at least one matching skill!');
  }
}

async function updateApplicationStatus(applicationId) {
  const select = document.getElementById(`status-${applicationId}`);
  const newStatus = select.value;

  try {
    const { error } = await supabase
      .from('applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    const appIndex = allApplications.findIndex(app => app.id === applicationId);
    if (appIndex !== -1) {
      allApplications[appIndex].status = newStatus;
    }

    const filteredIndex = filteredApplications.findIndex(app => app.id === applicationId);
    if (filteredIndex !== -1) {
      filteredApplications[filteredIndex].status = newStatus;
    }
  } catch (error) {
    alert('Error updating status: ' + error.message);
  }
}

function viewApplicantDetails(applicationId) {
  const app = allApplications.find(a => a.id === applicationId);
  if (!app) return;

  const applicant = app.profiles;
  const job = app.jobs;

  document.getElementById('applicantDetails').innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--primary-blue);">${applicant.full_name}</h3>
      <p style="color: var(--text-light);">Email: ${applicant.email}</p>
      <p style="color: var(--text-light);">Applied for: ${job.title}</p>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <strong>Skills:</strong>
      <div class="skills-container" style="margin-top: 0.5rem;">
        ${(applicant.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
    </div>

    ${applicant.experience ? `
      <div style="margin-bottom: 1.5rem;">
        <strong>Experience:</strong>
        <p style="margin-top: 0.5rem; color: var(--text-dark);">${applicant.experience}</p>
      </div>
    ` : ''}

    <div style="margin-bottom: 1.5rem;">
      <strong>Application Status:</strong>
      <p style="margin-top: 0.5rem;"><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></p>
    </div>
  `;

  document.getElementById('viewApplicantModal').classList.add('active');
}

async function showPostJob() {
  document.getElementById('mainContent').classList.add('hidden');
  document.getElementById('applicationsContent').classList.add('hidden');
  document.getElementById('myJobsContent').classList.add('hidden');
  document.getElementById('postJobContent').classList.remove('hidden');
}

async function handlePostJob(event) {
  event.preventDefault();

  const title = document.getElementById('jobTitle').value;
  const description = document.getElementById('jobDescription').value;
  const skillsStr = document.getElementById('requiredSkills').value;
  const location = document.getElementById('jobLocation').value;
  const jobType = document.getElementById('jobType').value;

  const requiredSkills = skillsStr.split(',').map(s => s.trim()).filter(s => s);

  const successDiv = document.getElementById('postJobSuccess');
  const errorDiv = document.getElementById('postJobError');

  successDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        company_id: currentUser.id,
        title: title,
        description: description,
        required_skills: requiredSkills,
        location: location,
        job_type: jobType,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    myJobs.push(data);

    successDiv.textContent = 'Job posted successfully!';
    successDiv.classList.remove('hidden');

    document.getElementById('postJobForm').reset();

    setTimeout(() => {
      successDiv.classList.add('hidden');
    }, 3000);

    loadStats();
  } catch (error) {
    errorDiv.textContent = 'Error posting job: ' + error.message;
    errorDiv.classList.remove('hidden');
  }
}

async function showMyJobs() {
  document.getElementById('mainContent').classList.add('hidden');
  document.getElementById('applicationsContent').classList.add('hidden');
  document.getElementById('postJobContent').classList.add('hidden');
  document.getElementById('myJobsContent').classList.remove('hidden');

  await loadMyJobs();
}

async function loadMyJobs() {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    myJobs = jobs || [];
    displayMyJobs(jobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
    document.getElementById('myJobsList').innerHTML = '<p class="empty-state">Error loading jobs</p>';
  }
}

function displayMyJobs(jobs) {
  const container = document.getElementById('myJobsList');

  if (jobs.length === 0) {
    container.innerHTML = '<div class="empty-state"><h2>No jobs posted yet</h2><p>Post your first job to start receiving applications</p></div>';
    return;
  }

  container.innerHTML = jobs.map(job => {
    const postedDate = new Date(job.created_at).toLocaleDateString();

    return `
      <div class="job-card">
        <h3>${job.title}</h3>
        <p class="location">${job.location} • ${job.job_type}</p>
        <div class="skills-container">
          ${(job.required_skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
        <p style="color: var(--text-light); margin: 1rem 0;">${job.description.substring(0, 150)}...</p>
        <p style="color: var(--text-light); font-size: 0.875rem;">Posted on: ${postedDate}</p>
        <div style="margin-top: 1rem;">
          <span class="status-badge ${job.is_active ? 'status-accepted' : 'status-rejected'}">
            ${job.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  supabase.auth.signOut();
  window.location.href = 'jobsphere.html';
}

window.showApplicationsManager = showApplicationsManager;
window.showPostJob = showPostJob;
window.showMyJobs = showMyJobs;
window.filterApplicants = filterApplicants;
window.autoFilterApplicants = autoFilterApplicants;
window.updateApplicationStatus = updateApplicationStatus;
window.viewApplicantDetails = viewApplicantDetails;
window.handlePostJob = handlePostJob;
window.closeModal = closeModal;
window.handleLogout = handleLogout;

checkAuth();