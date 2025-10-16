import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  console.error('Please ensure your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

let selectedUserType = 'jobseeker';

function showLoginModal() {
  document.getElementById('loginModal').classList.add('active');
}

function showRegisterModal() {
  document.getElementById('registerModal').classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  const form = document.getElementById(modalId === 'loginModal' ? 'loginForm' : 'registerForm');
  if (form) form.reset();

  const errors = document.querySelectorAll('.alert');
  errors.forEach(el => el.classList.add('hidden'));
}

function selectUserType(type) {
  selectedUserType = type;
  document.getElementById('userType').value = type;

  const options = document.querySelectorAll('.user-type-option');
  options.forEach(opt => opt.classList.remove('selected'));
  
  // Find the clicked option by data attribute or type
  const clickedOption = document.querySelector(`.user-type-option[onclick="selectUserType('${type}')"]`);
  if (clickedOption) {
    clickedOption.classList.add('selected');
  }

  const companyNameGroup = document.getElementById('companyNameGroup');
  const skillsGroup = document.getElementById('skillsGroup');
  const experienceGroup = document.getElementById('experienceGroup');
  const nameLabel = document.getElementById('nameLabel');

  if (type === 'company') {
    companyNameGroup.style.display = 'block';
    skillsGroup.style.display = 'none';
    experienceGroup.style.display = 'none';
    nameLabel.textContent = '(Contact Person)';
    document.getElementById('companyName').required = true;
    document.getElementById('skills').required = false;
  } else {
    companyNameGroup.style.display = 'none';
    skillsGroup.style.display = 'block';
    experienceGroup.style.display = 'block';
    nameLabel.textContent = '';
    document.getElementById('companyName').required = false;
    document.getElementById('skills').required = false;
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  errorDiv.classList.add('hidden');

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      throw new Error('Profile not found. Please register first.');
    }

    localStorage.setItem('currentUser', JSON.stringify(profile));

    if (profile.user_type === 'jobseeker') {
      window.location.href = 'jobseeker.html';
    } else {
      window.location.href = 'company.html';
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const fullName = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const userType = document.getElementById('userType').value;
  const companyName = document.getElementById('companyName').value;
  const skills = document.getElementById('skills').value;
  const experience = document.getElementById('experience').value;

  const errorDiv = document.getElementById('registerError');
  const successDiv = document.getElementById('registerSuccess');

  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [];

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_type: userType,
        full_name: fullName,
        email: email,
        skills: skillsArray,
        experience: experience || '',
        company_name: companyName || ''
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    successDiv.textContent = 'Account created successfully! Redirecting...';
    successDiv.classList.remove('hidden');

    localStorage.setItem('currentUser', JSON.stringify(profile));

    setTimeout(() => {
      if (userType === 'jobseeker') {
        window.location.href = 'jobseeker.html';
      } else {
        window.location.href = 'company.html';
      }
    }, 1500);
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeModal = closeModal;
window.selectUserType = selectUserType;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;