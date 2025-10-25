// DOM Elements
const loginPage = document.getElementById('login-page');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing NotiZAR');
    
    // Initialize all functionality
    initLoginFunctionality();
    initEmergencyReporting();
    initSidebar();
    initHeaderButtons();
    initNavigation();
    initSmoothScrolling();
});

// Login functionality
function initLoginFunctionality() {
    // Main login form
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Static credentials
            if ((username === 'user' && password === 'user') || (username === 'admin' && password === 'admin')) {
                loginError.style.display = 'none';
                
                if (username === 'admin') {
                    window.location.href = "WebApp/Admin/Admin.html";
                } else {
                    window.location.href = "/TVH_NotiZAR/WebApp/End_User/EndUser.html";
                }
            } else {
                loginError.style.display = 'block';
            }
        });
    }

    // Back to home button
    const backToHome = document.querySelector('.back-to-home');
    if (backToHome) {
        backToHome.addEventListener('click', hideLoginPage);
    }
}

// Show login page
function showLoginPage() {
    if (loginPage && mainContent) {
        // Store current scroll position
        const scrollY = window.scrollY;
        
        // Show login page and hide main content
        loginPage.classList.remove('hidden');
        mainContent.classList.add('hidden');
        
        // Add class to body to prevent scrolling
        document.body.classList.add('login-active');
        
        // Reset scroll position to top
        window.scrollTo(0, 0);
        
        addBackToHomeButton();
    }
}

// Hide login page
function hideLoginPage() {
    if (loginPage && mainContent) {
        loginPage.classList.add('hidden');
        mainContent.classList.remove('hidden');
        document.body.classList.remove('login-active');
    }
}

// Add back button to login page
function addBackToHomeButton() {
    const loginPage = document.getElementById('login-page');
    if (loginPage && !loginPage.querySelector('.back-to-home')) {
        const backButton = document.createElement('button');
        backButton.className = 'back-to-home';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Home';
        backButton.addEventListener('click', hideLoginPage);
        loginPage.appendChild(backButton);
    }
}

// Emergency Reporting Functions
function initEmergencyReporting() {
    const emergencyBtn = document.getElementById('emergency-report-btn');
    const emergencyModal = document.getElementById('emergency-report-modal');
    const closeModalBtn = document.getElementById('close-emergency-modal');
    const getLocationBtn = document.getElementById('emergency-get-location');
    const reportForm = document.getElementById('anonymous-report-form');

    if (!emergencyBtn || !emergencyModal) {
        console.log('Emergency reporting elements not found');
        return;
    }

    // Show emergency modal
    emergencyBtn.addEventListener('click', () => {
        emergencyModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    // Close emergency modal
    closeModalBtn.addEventListener('click', () => {
        emergencyModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    });

    // Close modal when clicking outside
    emergencyModal.addEventListener('click', (e) => {
        if (e.target === emergencyModal) {
            emergencyModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });

    // Get current location
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getEmergencyLocation);
    }

    // Handle form submission
    if (reportForm) {
        reportForm.addEventListener('submit', handleEmergencyReport);
    }
}

function getEmergencyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const locationInput = document.getElementById('emergency-location');
                if (locationInput) {
                    locationInput.value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
                }
                showNotification('Location obtained successfully!', 'success');
            },
            (error) => {
                console.error('Error getting location:', error);
                showNotification('Unable to get location. Please enter manually.', 'error');
            }
        );
    } else {
        showNotification('Geolocation not supported.', 'error');
    }
}

function handleEmergencyReport(e) {
    e.preventDefault();
    
    const type = document.getElementById('emergency-type').value;
    const location = document.getElementById('emergency-location').value;
    const description = document.getElementById('emergency-description').value;
    
    if (!type || !location || !description) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    // Simulate sending emergency report
    console.log('Emergency Report:', { type, location, description });
    
    // Show success message
    showNotification('Emergency report sent! Authorities have been notified.', 'success');
    
    // Close modal and reset form
    const emergencyModal = document.getElementById('emergency-report-modal');
    const reportForm = document.getElementById('anonymous-report-form');
    
    if (emergencyModal) emergencyModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (reportForm) reportForm.reset();
}

// Sidebar functionality
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebarClose = document.querySelector('.sidebar-close');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    if (!sidebar || !sidebarToggle) {
        console.log('Sidebar elements not found');
        return;
    }

    // Open sidebar
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking on links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (link.classList.contains('login-sidebar-btn')) {
                e.preventDefault();
                closeSidebar();
                showLoginPage();
            } else if (link.classList.contains('report-sidebar-btn')) {
                e.preventDefault();
                closeSidebar();
                showEmergencyModal();
            } else if (href && href.startsWith('#')) {
                // Internal link - close sidebar and scroll
                e.preventDefault();
                closeSidebar();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            } else {
                closeSidebar();
            }
        });
    });
}

// Show emergency modal function
function showEmergencyModal() {
    const emergencyModal = document.getElementById('emergency-report-modal');
    if (emergencyModal) {
        emergencyModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Header buttons functionality
function initHeaderButtons() {
    const headerLoginBtn = document.getElementById('header-login-btn');
    const headerReportBtn = document.getElementById('header-report-btn');
    const getStartedBtn = document.getElementById('get-started-btn');
    const learnMoreBtn = document.getElementById('learn-more-btn');
    const ctaLoginBtn = document.getElementById('cta-login-btn');
    const ctaSignupBtn = document.getElementById('cta-signup-btn');

    if (headerLoginBtn) {
        headerLoginBtn.addEventListener('click', showLoginPage);
    }

    if (headerReportBtn) {
        headerReportBtn.addEventListener('click', showEmergencyModal);
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPage();
        });
    }

    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (ctaLoginBtn) {
        ctaLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPage();
        });
    }

    if (ctaSignupBtn) {
        ctaSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPage();
        });
    }
}

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
        let current = '';
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    window.addEventListener('load', updateActiveNav);
}

// Smooth scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Notification system
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize Lucide icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}