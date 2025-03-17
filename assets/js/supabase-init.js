/**
 * supabase-init.js
 * This file initializes the Supabase client and provides shared functionality
 * for interacting with the Supabase backend.
 */

// Supabase configuration
const SUPABASE_URL = 'https://jjgxscdeythxguysxoql.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3hzY2RleXRoeGd1eXN4b3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNzA5MjUsImV4cCI6MjA1Nzc0NjkyNX0.dRpbadY9veicxnt1bTOpnFpYI2fnJuHcMYx1fKKn8Tc'; // Replace with your Supabase anon key

// Initialize Supabase client
let supabaseClient;

// Initialize the Supabase client
function initializeSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return supabaseClient;
    } else {
        console.error('Supabase JS library not loaded');
        return null;
    }
}

// Get or initialize the Supabase client
function getSupabaseClient() {
    if (!supabaseClient) {
        return initializeSupabase();
    }
    return supabaseClient;
}

/**
 * Checks if the user is authenticated
 * @returns {Object|null} The current user or null if not authenticated
 */
async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data } = await client.auth.getUser();
        return data?.user || null;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Checks if the user session is valid
 * @returns {Boolean} True if session is valid, false otherwise
 */
async function isSessionValid() {
    const client = getSupabaseClient();
    if (!client) return false;
    
    // Updated to use getSession()
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) return false;
    
    // Verify session is still valid
    const { data, error } = await client.auth.getUser();
    
    return !error && data;
}

/**
 * Checks if the current user has admin privileges
 * @returns {Promise<Boolean>} True if user is admin, false otherwise
 */
async function isUserAdmin() {
    const client = getSupabaseClient();
    if (!client) return false;
    
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return false;
    
    try {
        const { data, error } = await client
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();
            
        if (error) throw error;
        
        return data?.is_admin || false;
    } catch (error) {
        console.error('Error checking admin status:', error.message);
        return false;
    }
}

/**
 * Redirects to login page if user is not authenticated
 * @param {String} redirectUrl URL to redirect to after login
 */
async function requireAuth(redirectUrl = null) {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    
    if (!user) {
        const currentUrl = window.location.pathname;
        const loginUrl = '/pages/auth/login.html';
        
        // Add redirect parameter if provided
        if (redirectUrl) {
            window.location.href = `${loginUrl}?redirect=${encodeURIComponent(redirectUrl)}`;
        } else if (!currentUrl.includes('/auth/')) {
            window.location.href = `${loginUrl}?redirect=${encodeURIComponent(currentUrl)}`;
        } else {
            window.location.href = loginUrl;
        }
    }
    
    return user;
}

/**
 * Redirects to home page if user is already authenticated
 */
async function redirectIfAuthenticated() {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    
    if (user) {
        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = '/index.html';
        }
    }
}

/**
 * Checks if the current user can access admin pages
 * Redirects to home page if not admin
 */
async function requireAdmin() {
    const user = await requireAuth();
    
    if (!user) return false;
    
    const isAdmin = await isUserAdmin();
    
    if (!isAdmin) {
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

/**
 * Sets up event listeners for auth state changes
 * @param {Function} callback Function to call when auth state changes
 */
function setupAuthListener(callback) {
    const client = getSupabaseClient();
    if (!client) return;
    
    client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            if (typeof callback === 'function') {
                callback(event, session);
            }
        }
    });
}

/**
 * Handles auth state changes across the application
 * @param {String} event Auth event type
 * @param {Object} session User session
 */
function handleAuthStateChange(event, session) {
    switch (event) {
        case 'SIGNED_IN':
            console.log('User signed in:', session?.user?.email);
            break;
        case 'SIGNED_OUT':
            console.log('User signed out');
            break;
        case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            break;
    }
    
    // Broadcast auth state change event
    const authEvent = new CustomEvent('authStateChanged', { 
        detail: { event, session } 
    });
    document.dispatchEvent(authEvent);
}

/**
 * Refreshes the user session if needed
 */
async function refreshSessionIfNeeded() {
    const client = getSupabaseClient();
    if (!client) return;
    
    // Updated to use getSession()
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) return;
    
    // Check if session is close to expiration (within 5 minutes)
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresAt - now < fiveMinutes) {
        try {
            const { data, error } = await client.auth.refreshSession();
            
            if (error) throw error;
            
            console.log('Session refreshed');
        } catch (error) {
            console.error('Error refreshing session:', error.message);
        }
    }
}

/**
 * Handles errors from Supabase
 * @param {Object} error Error object from Supabase
 * @returns {String} User-friendly error message
 */
function handleSupabaseError(error) {
    if (!error) return 'Unknown error occurred';
    
    // Map common Supabase error codes to user-friendly messages
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address. Please try again.';
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use a stronger password.';
        case 'auth/too-many-requests':
            return 'Too many login attempts. Please try again later.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

/**
 * Initializes the Supabase client and auth listeners
 */
function initSupabase() {
    // Initialize Supabase client
    initializeSupabase();
    
    // Setup auth listener
    setupAuthListener(handleAuthStateChange);
    
    // Check session validity and refresh if needed
    refreshSessionIfNeeded();
    
    // Set up periodic session refresh
    setInterval(refreshSessionIfNeeded, 4 * 60 * 1000); // Every 4 minutes
    
    // Listen for auth state change events
    document.addEventListener('authStateChanged', function(e) {
        const { event, session } = e.detail;
        // Custom handling for specific pages can be added here
    });
    
    console.log('Supabase initialization complete');
}

// Initialize Supabase when the script loads
document.addEventListener('DOMContentLoaded', initSupabase);

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabaseClient,
        getCurrentUser,
        isSessionValid,
        isUserAdmin,
        requireAuth,
        redirectIfAuthenticated,
        requireAdmin,
        handleSupabaseError
    };
} else {
    // Expose functions globally
    window.supabaseUtils = {
        getSupabaseClient,
        getCurrentUser,
        isSessionValid,
        isUserAdmin,
        requireAuth,
        redirectIfAuthenticated,
        requireAdmin,
        handleSupabaseError
    };
}