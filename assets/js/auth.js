
// Wait for supabase-init.js to initialize before using Supabase
document.addEventListener('DOMContentLoaded', function() {
    // Functions will be available after DOM is loaded and supabase-init.js is executed
    initAuth();
});

// Initialize auth-related functionality
function initAuth() {
    // Check if supabaseUtils is available
    if (!window.supabaseUtils) {
        console.error('supabaseUtils not available. Make sure supabase-init.js is loaded before auth.js');
        return;
    }
    
    // Check authentication state
    checkAuthState();
    
    // Setup password toggles
    setupPasswordToggles();
    
    // Setup reset password form if exists
    setupResetPasswordForm();
    
    // Add email validation to registration
    setupEmailValidation();
    
    // Setup auth forms
    setupAuthForms();
}

// Check authentication state
async function checkAuthState() {
    const { getCurrentUser, isUserAdmin } = window.supabaseUtils;
    
    try {
        const user = await getCurrentUser();
        
        if (user) {
            // User is logged in
            // Redirect if on login/register page
            const currentPath = window.location.pathname;
            if (currentPath.includes('/auth/login.html') || currentPath.includes('/auth/register.html')) {
                window.location.href = '../../index.html';
            }
            
            // Update UI to show logged in state
            updateUIForLoggedInUser(user);
            
            // Check if user is admin
            const isAdmin = await isUserAdmin();
            if (isAdmin) {
                // Show admin dashboard link
                addAdminLink();
            }
        } else {
            // User is not logged in
            // Update UI to show logged out state
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error("Error checking auth state:", error);
        updateUIForLoggedOutUser();
    }
}


// Update UI for logged in users
function updateUIForLoggedInUser(user) {
    // Find all nav elements (might be on multiple pages)
    const navElements = document.querySelectorAll('nav ul');
    
    navElements.forEach(nav => {
        // Check if auth-links already exists to avoid duplicates
        const existingAuthLinks = nav.querySelector('.auth-links');
        if (existingAuthLinks) {
            existingAuthLinks.remove();
        }

        // Create auth links container
        const authLinks = document.createElement('li');
        authLinks.className = 'auth-links';
        
        // Create profile link
        const profileLink = document.createElement('a');
        profileLink.href = '#'; // Could link to profile page in the future
        profileLink.textContent = user.email.split('@')[0]; // Show username from email
        
        // Create logout button
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.className = 'btn btn-small';
        logoutButton.addEventListener('click', handleLogout);
        
        // Add elements to the nav
        authLinks.appendChild(profileLink);
        authLinks.appendChild(logoutButton);
        
        // Check if there's a dark mode toggle and insert before it
        const darkModeToggle = nav.querySelector('#dark-mode-toggle')?.parentElement;
        if (darkModeToggle) {
            nav.insertBefore(authLinks, darkModeToggle);
        } else {
            nav.appendChild(authLinks);
        }
    });
}

// Update UI for logged out users
function updateUIForLoggedOutUser() {
    // Find all nav elements (might be on multiple pages)
    const navElements = document.querySelectorAll('nav ul');
    
    navElements.forEach(nav => {
        // Check if auth-links already exists to avoid duplicates
        const existingAuthLinks = nav.querySelector('.auth-links');
        if (existingAuthLinks) {
            existingAuthLinks.remove();
        }

        // Create auth links container
        const authLinks = document.createElement('li');
        authLinks.className = 'auth-links';
        
        // Create login link
        const loginLink = document.createElement('a');
        loginLink.href = '/pages/auth/login.html';
        loginLink.textContent = 'Login';
        
        // Create register link
        const registerLink = document.createElement('a');
        registerLink.href = '/pages/auth/register.html';
        registerLink.textContent = 'Register';
        
        // Add elements to the nav
        authLinks.appendChild(loginLink);
        authLinks.appendChild(registerLink);
        
        // Check if there's a dark mode toggle and insert before it
        const darkModeToggle = nav.querySelector('#dark-mode-toggle')?.parentElement;
        if (darkModeToggle) {
            nav.insertBefore(authLinks, darkModeToggle);
        } else {
            nav.appendChild(authLinks);
        }
    });
}

// Add admin dashboard link to navigation
function addAdminLink() {
    const navElements = document.querySelectorAll('nav ul');
    
    navElements.forEach(nav => {
        // Check if admin link already exists
        const existingAdminLink = nav.querySelector('.admin-link');
        if (existingAdminLink) return;
        
        // Create admin link
        const adminLi = document.createElement('li');
        adminLi.className = 'admin-link';
        
        const adminLink = document.createElement('a');
        adminLink.href = '/pages/admin/dashboard.html';
        adminLink.textContent = 'Admin';
        
        adminLi.appendChild(adminLink);
        
        // Insert after the first link (Home)
        const homeLink = nav.querySelector('li');
        if (homeLink && homeLink.nextSibling) {
            nav.insertBefore(adminLi, homeLink.nextSibling);
        } else {
            nav.appendChild(adminLi);
        }
    });
}

// Handle user registration
async function registerUser(email, password) {
    const { getSupabaseClient, handleSupabaseError } = window.supabaseUtils;
    const supabase = getSupabaseClient();
    
    try {
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        
        // Create user profile in users table
        const { data, error: profileError } = await supabase
            .from('users')
            .insert([{ id: user.id, email: user.email, is_admin: false }]);
            
        if (profileError) throw profileError;
        
        return { user, data };
    } catch (error) {
        console.error('Error registering user:', error.message);
        throw error;
    }
}

// Handle user login
async function loginUser(email, password) {
    const { getSupabaseClient, handleSupabaseError } = window.supabaseUtils;
    const supabase = getSupabaseClient();
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) throw error;
        
        return { user: data.user, session: data.session };
    } catch (error) {
        console.error('Error logging in:', error.message);
        throw error;
    }
}

async function registerUser(email, password) {
    const { getSupabaseClient, handleSupabaseError } = window.supabaseUtils;
    const supabase = getSupabaseClient();
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        
        // Create user profile in users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert([{ id: data.user.id, email: data.user.email, is_admin: false }]);
            
        if (profileError) throw profileError;
        
        return { user: data.user, data: profileData };
    } catch (error) {
        console.error('Error registering user:', error.message);
        throw error;
    }
}

// Handle user logout
async function handleLogout() {
    const { getSupabaseClient } = window.supabaseUtils;
    const supabase = getSupabaseClient();
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Redirect to home page
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
}

// Setup auth forms
function setupAuthForms() {
    // Setup login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('login-error');
            
            try {
                errorElement.textContent = '';
                const result = await loginUser(email, password);
                
                // Redirect to home page on successful login
                window.location.href = '../../index.html';
            } catch (error) {
                errorElement.textContent = error.message || 'Login failed. Please try again.';
            }
        });
    }
    
    // Setup register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorElement = document.getElementById('register-error');
            
            // Check if passwords match
            if (password !== confirmPassword) {
                errorElement.textContent = 'Passwords do not match.';
                return;
            }
            
            try {
                errorElement.textContent = '';
                const result = await registerUser(email, password);
                
                // Show success message
                alert('Registration successful! Please check your email for verification link.');
                
                // Redirect to login page
                window.location.href = 'login.html';
            } catch (error) {
                errorElement.textContent = error.message || 'Registration failed. Please try again.';
            }
        });
    }
    
    // Setup password validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePassword(this);
        });
    }
}

// Validate password strength
function validatePassword(passwordInput) {
    const password = passwordInput.value;
    const minLength = 8;
    
    // Get or create password feedback element
    let feedbackElement = document.getElementById('password-feedback');
    if (!feedbackElement) {
        feedbackElement = document.createElement('small');
        feedbackElement.id = 'password-feedback';
        passwordInput.parentNode.appendChild(feedbackElement);
    }
    
    // Reset feedback
    feedbackElement.className = '';
    
    // Check password length
    if (password.length < minLength) {
        feedbackElement.textContent = `Password must be at least ${minLength} characters long`;
        feedbackElement.className = 'error-text';
        return false;
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        feedbackElement.textContent = 'Password should include at least one uppercase letter';
        feedbackElement.className = 'warning-text';
        return true; // Not a hard requirement
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        feedbackElement.textContent = 'Password should include at least one number';
        feedbackElement.className = 'warning-text';
        return true; // Not a hard requirement
    }
    
    // Password is strong
    feedbackElement.textContent = 'Password strength: Good';
    feedbackElement.className = 'success-text';
    return true;
}

// Setup email validation
function setupEmailValidation() {
    const emailInput = document.getElementById('email');
    if (emailInput && document.getElementById('register-form')) {
        emailInput.addEventListener('blur', async function() {
            const email = this.value;
            if (email && this.validity.valid) {
                try {
                    const exists = await checkEmailExists(email);
                    
                    let feedbackElement = document.getElementById('email-feedback');
                    if (!feedbackElement) {
                        feedbackElement = document.createElement('small');
                        feedbackElement.id = 'email-feedback';
                        this.parentNode.appendChild(feedbackElement);
                    }
                    
                    if (exists) {
                        feedbackElement.textContent = 'This email is already registered';
                        feedbackElement.className = 'error-text';
                    } else {
                        feedbackElement.textContent = '';
                    }
                } catch (error) {
                    console.error('Error validating email:', error);
                }
            }
        });
    }
}

// Check if email exists
async function checkEmailExists(email) {
    const { getSupabaseClient } = window.supabaseUtils;
    const supabase = getSupabaseClient();
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();
            
        if (error && error.code !== 'PGRST116') {
            // PGRST116 is the error code for "no rows returned"
            throw error;
        }
        
        return !!data;
    } catch (error) {
        console.error('Error checking email:', error.message);
        throw error;
    }
}

// Add password visibility toggle
function setupPasswordToggles() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle';
        toggleButton.innerHTML = '👁️';
        toggleButton.setAttribute('aria-label', 'Toggle password visibility');
        
        // Position the button
        field.parentNode.style.position = 'relative';
        toggleButton.style.position = 'absolute';
        toggleButton.style.right = '10px';
        toggleButton.style.top = '50%';
        toggleButton.style.transform = 'translateY(-50%)';
        toggleButton.style.border = 'none';
        toggleButton.style.background = 'transparent';
        toggleButton.style.cursor = 'pointer';
        
        // Insert the button
        field.parentNode.appendChild(toggleButton);
        
        // Add event listener
        toggleButton.addEventListener('click', function() {
            const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
            field.setAttribute('type', type);
            toggleButton.innerHTML = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    });
}

// Setup reset password form
function setupResetPasswordForm() {
    const resetForm = document.getElementById('reset-password-form');
    
    if (resetForm) {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('reset-email').value;
            const statusElement = document.getElementById('reset-status');
            
            try {
                statusElement.textContent = 'Sending reset link...';
                statusElement.className = 'info-text';
                
                await resetPassword(email);
                
                statusElement.textContent = 'Password reset link sent! Check your email.';
                statusElement.className = 'success-text';
                
                // Clear the input
                document.getElementById('reset-email').value = '';
            } catch (error) {
                statusElement.textContent = error.message || 'Failed to send reset link. Please try again.';
                statusElement.className = 'error-text';
            }
        });
    }
}

// Reset password functionality
async function resetPassword(email) {
    const { getSupabaseClient } = window.supabaseUtils;
    const supabase = getSupabaseClient();
    
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error resetting password:', error.message);
        throw error;
    }
}

// Listen for auth state changes
document.addEventListener('authStateChanged', function(e) {
    const { event, session } = e.detail;
    
    if (event === 'SIGNED_IN') {
        checkAuthState();
    } else if (event === 'SIGNED_OUT') {
        updateUIForLoggedOutUser();
    }
});

