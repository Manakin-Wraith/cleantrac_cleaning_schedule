// Initialize EmailJS
(function() {
    emailjs.init("hq7dSeC7TQRSmywTN");
})();

// Toast notification function
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('i');
    icon.className = `toast-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
    
    const messageElement = document.createElement('span');
    messageElement.className = 'toast-message';
    messageElement.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(messageElement);
    toastContainer.appendChild(toast);
    
    // Trigger reflow to enable animation
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Waitlist form submission handler
document.getElementById('waitlistForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    // Get form data
    const formData = {
        name: this.querySelector('#name').value,
        email: this.querySelector('#email').value,
        company: this.querySelector('#company').value,
        role: this.querySelector('#role').value,
        message: this.querySelector('#message').value
    };
    
    // Send email using EmailJS
    emailjs.send('service_5ndhkxp', 'template_2yl8kcg', formData)
        .then(() => {
            showToast('Thank you for joining our waitlist! We\'ll be in touch soon.', 'success');
            this.reset();
        })
        .catch(() => {
            showToast('Oops! Something went wrong. Please try again later.', 'error');
        })
        .finally(() => {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
});

// Mobile menu toggle
function toggleMenu() {
    const menu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.nav-overlay');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Event listeners for mobile menu
const hamburger = document.querySelector('.hamburger');
const navOverlay = document.querySelector('.nav-overlay');

hamburger.addEventListener('click', toggleMenu);
navOverlay.addEventListener('click', toggleMenu);

// Close mobile menu when clicking nav links
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const menu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger');
        const overlay = document.querySelector('.nav-overlay');
        menu.classList.remove('active');
        hamburger.classList.remove('active');
        overlay.classList.remove('active');
    });
});

// Back to top button functionality
const backToTopButton = document.querySelector('.back-to-top');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Features Accordion
document.addEventListener('DOMContentLoaded', function() {
    const featureItems = document.querySelectorAll('.feature-item');
    
    featureItems.forEach(item => {
        const header = item.querySelector('.feature-header');
        
        header.addEventListener('click', () => {
            const currentlyActive = document.querySelector('.feature-item.active');
            
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove('active');
            }
            
            item.classList.toggle('active');
        });
    });
});

// Workflow accordion functionality
document.querySelectorAll('.workflow-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const content = item.querySelector('.workflow-content');
        
        // Close all other accordions
        document.querySelectorAll('.workflow-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                const otherContent = otherItem.querySelector('.workflow-content');
                otherContent.style.maxHeight = null;
            }
        });
        
        // Toggle current accordion
        item.classList.toggle('active');
        if (item.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = null;
        }
    });
});
