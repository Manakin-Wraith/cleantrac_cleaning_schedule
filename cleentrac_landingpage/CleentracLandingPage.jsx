import React, { useState, useEffect } from 'react';
import './styles.css';
import emailjs from 'emailjs-com';

const CleentracLandingPage = () => {
  const [menuActive, setMenuActive] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    emailjs.init('hq7dSeC7TQRSmywTN');
    
    const handleScroll = () => {
      const backToTopButton = document.querySelector('.back-to-top');
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  const handleFormSubmit = e => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    const formData = {
      name: form.name.value,
      email: form.email.value,
      role: form.role.value,
      message: form.message.value,
    };

    emailjs.send('service_5ndhkxp', 'template_2yl8kcg', formData)
      .then(() => {
        setToastMessage("Thank you for joining our waitlist! We'll be in touch soon.");
        setToastType('success');
        form.reset();
      }).catch(() => {
        setToastMessage("Oops! Something went wrong. Please try again later.");
        setToastType('error');
      }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  };

  return (
    <div>
      <div className="toast-container">
        {toastMessage && (
          <div className={`toast ${toastType}`}>
            <i className={`toast-icon fas ${toastType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
            <span className="toast-message">{toastMessage}</span>
          </div>
        )}
      </div>
      
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav-container">
            <div className="logo-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="logo">
                <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z" />
              </svg>
              <span className="logo-text">CLEENTRAC</span>
            </div>
            <button className="hamburger" onClick={toggleMenu}>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <div className={`nav-menu ${menuActive ? 'active' : ''}`}>
              {['Features', 'How it Works', 'Join Waitlist', 'Contact'].map((link, i) => (
                <a href={`#${link.toLowerCase().replace(' ', '')}`} className="nav-link" key={i}>{link}</a>
              ))}
            </div>
            <div className={`nav-overlay ${menuActive ? 'active' : ''}`} onClick={toggleMenu}></div>
          </nav>
          <div className="header-content">
            <div className="header-text">
              <h1>Effortless Food Safety & Production Compliance Management</h1>
              <p>CleanTrac unifies cleaning schedules, recipe production, temperature monitoring, and supplier management—keeping your team audit-ready every day.</p>
              <div className="header-cta">
                <a href="mailto:demo@cleantrac.co.za?subject=Book%20a%20Call%20Request&body=I'm%20interested%20in%20booking%20a%20call%20with%20CleanTrac.%20Please%20contact%20me%20with%20available%20time%20slots." className="cta-button primary">
                  <span>Book a Demo</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="icon">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </a>
                <p className="cta-note">Experience the future of food safety compliance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2>Features</h2>
          <p className="section-description">Discover how CleanTrac revolutionizes food safety and production compliance</p>
          <div className="features-accordion">
            {['Smart Inventory Management', 'Real-Time Monitoring', 'Analytics Dashboard', 'Secure Data Management', 'Recall Management', 'Audit Trails', 'Flagging System'].map((feature, i) => (
              <div className="feature-item" key={i}>
                <div className="feature-header" onClick={() => toggleMenu()}> {/* Add functionality here */}
                  <div className="feature-icon">
                    {/* Use appropriate SVG icon here */}
                  </div>
                  <div className="feature-title">
                    <h3>{feature}</h3>
                  </div>
                  <span className="feature-toggle">+</span>
                </div>
                <div className="feature-content">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque imperdiet ligula ut feugiat bibendum.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="waitlist">
        <div className="container">
          <div className="section-header">
            <h2><i className="fas fa-envelope-open-text"></i> Join the Waitlist</h2>
            <p>Be among the first to experience CLEENTRAC. Sign up now and get early access to our revolutionary food production management system.</p>
          </div>
          <div className="waitlist-container">
            <form id="waitlistForm" className="waitlist-form" onSubmit={handleFormSubmit}>
              <div className="form-group">
                <input type="text" id="name" name="name" placeholder="Full Name" required />
              </div>
              <div className="form-group">
                <input type="email" id="email" name="email" placeholder="Email Address" required />
              </div>
              <div className="form-group">
                <select id="role" name="role" required>
                  <option value="">Select Your Role</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="manager">Manager</option>
                  <option value="chef">Chef</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <textarea id="message" name="message" placeholder="Tell us about your business needs (optional)"></textarea>
              </div>
              <button type="submit" className="submit-btn">Join Waitlist</button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Food Safety Management?</h2>
          <p>Experience the power of CLEENTRAC and take control of your business operations.</p>
          <a href="mailto:demo@cleentrac.co.za?subject=Book%20a%20Call%20Request&body=I'm%20interested%20in%20booking%20a%20call%20with%20CLEENTRAC.%20Please%20contact%20me%20with%20available%20time%20slots." className="cta-button"><span>Learn More</span></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="logo">
                <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z" />
              </svg>
              <span className="logo-text">CLEENTRAC</span>
            </div>
            <div className="footer-text">
              <p>Made with lots of ❤️ and ☕️</p>
              <p className="copyright">2024 CLEENTRAC. All rights reserved.</p>
            </div>
          </div>
          <a href="https://www.lovecode.co.za" target="_blank" rel="noopener noreferrer">
            <img src="❤️code.png" alt="DevHouse Logo" className="devhouse-logo" />
          </a>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button className="back-to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <i className="fas fa-chevron-up"></i>
      </button>
    </div>
  );
};

export default CleentracLandingPage;
