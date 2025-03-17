document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = darkModeToggle.querySelector('.material-icons');
    
    // Check for saved preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    // Set initial theme based on stored preference or system preference
    if (storedTheme === 'dark' || (!storedTheme && prefersDarkMode)) {
        document.body.classList.add('dark-mode');
        darkModeIcon.textContent = 'light_mode';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeIcon.textContent = 'dark_mode';
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            darkModeIcon.textContent = 'light_mode';
        } else {
            localStorage.setItem('theme', 'light');
            darkModeIcon.textContent = 'dark_mode';
        }
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                darkModeIcon.textContent = 'light_mode';
            } else {
                document.body.classList.remove('dark-mode');
                darkModeIcon.textContent = 'dark_mode';
            }
        }
    });
});