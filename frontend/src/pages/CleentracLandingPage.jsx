import React, { useState, useEffect } from 'react';
import './styles.css';
import './feature-card-colors.css';
import './workflow-styles.css';
import { submitWaitlistForm } from '../services/FormService';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InsightsIcon from '@mui/icons-material/Insights';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FlagIcon from '@mui/icons-material/Flag';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RouteIcon from '@mui/icons-material/Route';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const CleentracLandingPage = () => {
  // Menu state removed - using simple login link only
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [activeSection, setActiveSection] = useState('home');
  const [activeFeature, setActiveFeature] = useState(null);
  const [activeWorkflowItem, setActiveWorkflowItem] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Back to top button visibility
      const backToTopButton = document.querySelector('.back-to-top');
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
      
      // Scroll spy for navigation highlighting
      const sections = ['home', 'features', 'waitlist'];
      let currentSection = 'home';
      
      sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop - 100;
          const sectionHeight = section.offsetHeight;
          if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            currentSection = sectionId;
          }
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const sections = document.querySelectorAll('section[id]');
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (showWorkflowModal) {
      document.body.classList.add('has-modal');
    } else {
      document.body.classList.remove('has-modal');
    }
    
    return () => {
      document.body.classList.remove('has-modal');
    };
  }, [showWorkflowModal]);
  
  const toggleFeature = (index) => {
    setActiveFeature(activeFeature === index ? null : index);
  };

  const toggleWorkflowItem = (index) => {
    setActiveWorkflowItem(index);
    setShowWorkflowModal(true);
  };
  
  const closeWorkflowModal = () => {
    setShowWorkflowModal(false);
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

    submitWaitlistForm(formData)
      .then((response) => {
        setToastMessage(response.message);
        setToastType('success');
        form.reset();
      })
      .catch((error) => {
        setToastMessage(error.message || "Oops! Something went wrong. Please try again later.");
        setToastType('error');
      })
      .finally(() => {
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
      <header className="header" id="home">
        <div className="container">
          <nav className="nav-container">
            <div className="logo-container">
              <PieChartOutlineIcon className="logo" />
              <span className="logo-text">CLEENTRAC</span>
            </div>
            <div className="nav-menu visible">
              <a href="/login" className="nav-link login-link">Login</a>
            </div>
          </nav>
          <div className="header-content">
            <div className="header-text">
              <h1>Effortless Food Safety & Production Compliance Management</h1>
              <p>CLEENTRAC unifies cleaning schedules, recipe production, temperature monitoring, and supplier management—keeping your team audit-ready every day.</p>
              <div className="header-cta">
                <a href="mailto:demo@spatrac.co.za?subject=Book%20a%20Call%20Request&body=I'm%20interested%20in%20booking%20a%20call%20with%20CleanTrac.%20Please%20contact%20me%20with%20available%20time%20slots." className="cta-button primary">
                  <span>Find Out More</span>
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
      <section className="features-section" id="features">
        <div className="container">
          <h2>Key Features</h2>
          <p className="section-description">Discover how CLEENTRAC revolutionizes food safety and production compliance</p>
          <div className="feature-container">
            <div className="features-grid">
            {[
              {
                icon: <CalendarMonthIcon />,
                title: 'Smart Inventory Management',
                description: 'Real-time tracking and management of your food inventory with advanced analytics and predictive insights.',
                color: 'blue'
              },
              {
                icon: <InsightsIcon />,
                title: 'Real-Time Monitoring',
                description: 'Track your food products in real-time throughout the supply chain with detailed monitoring and alerts.',
                color: 'purple'
              },
              {
                icon: <PhoneIphoneIcon />,
                title: 'Analytics Dashboard',
                description: 'Comprehensive analytics and reporting tools for data-driven decision making and performance tracking.',
                color: 'green'
              },
              {
                icon: <GroupsIcon />,
                title: 'Secure Data Management',
                description: 'Advanced security protocols and data encryption to protect sensitive information and ensure data integrity.',
                color: 'orange'
              },
              {
                icon: <HistoryIcon />,
                title: 'Audit Trails',
                description: 'Comprehensive audit trail system with timestamped digital records for compliance and full product journey reporting.',
                color: 'teal'
              },
              {
                icon: <FlagIcon />,
                title: 'Flagging System',
                description: 'Advanced flagging system with automated alerts for expired products and a quarantine system for flagged batches.',
                color: 'amber'
              }
            ].map((feature, index) => (
              <div 
                className={`feature-card feature-${feature.color}`} 
                key={index}
                onClick={() => toggleFeature(index)}
              >
                <div className="feature-card-content">
                  <div className="feature-icon-wrapper">
                    {feature.icon}
                  </div>
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                  <div className="feature-card-overlay"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

      {/* How It Works Section */}
      <section className="workflow-section" id="workflow">
        <div className="container">
          <div className="section-header">
            <RouteIcon className="section-icon" />
            <h2>Complete Traceability Journey</h2>
          </div>
          <p className="section-description">Follow your products through every step of their journey with our comprehensive traceability system.</p>
          <div className="workflow-steps">
            {[
              {
                icon: <MenuBookIcon />,
                title: 'Receiving & Documentation',
                subtitle: 'Initial Product Entry',
                description: 'Record supplier details, document batch numbers, generate unique product identifiers, and store supplier documentation.',
                details: [
                  'Capture complete supplier information and certification',
                  'Generate and assign unique batch/lot numbers',
                  'Record product specifications and allergen information',
                  'Store digital copies of supplier documentation',
                  'Validate incoming product against specifications'
                ],
                color: 'blue'
              },
              {
                icon: <WarehouseIcon />,
                title: 'Storage Management',
                subtitle: 'Inventory Tracking',
                description: 'Track product locations, monitor storage conditions, implement FIFO/FEFO inventory management, and receive alerts for approaching expiry dates.',
                details: [
                  'Real-time inventory location tracking',
                  'Temperature and humidity monitoring logs',
                  'Automated FIFO/FEFO inventory management',
                  'Expiration date alerts and notifications',
                  'Storage condition compliance verification'
                ],
                color: 'purple'
              },
              {
                icon: <BarChartIcon />,
                title: 'Production Process',
                subtitle: 'Recipe & Batch Tracking',
                description: 'Link ingredients to recipes, record processing parameters, track allergen controls, and maintain equipment records.',
                details: [
                  'Digital recipe management with version control',
                  'Batch-specific processing parameter recording',
                  'Allergen control procedures and validation',
                  'Equipment maintenance and calibration logs',
                  'Process deviation documentation and corrective actions'
                ],
                color: 'green'
              },
              {
                icon: <CheckCircleIcon />,
                title: 'Quality Assurance',
                subtitle: 'Continuous Monitoring',
                description: 'Perform regular quality checks, monitor critical control points, document corrective actions, and generate compliance reports.',
                details: [
                  'Scheduled quality check procedures and results',
                  'Critical Control Point (CCP) monitoring system',
                  'Corrective action tracking and verification',
                  'Automated compliance report generation',
                  'Quality trend analysis and improvement tracking'
                ],
                color: 'orange'
              },
              {
                icon: <LocalShippingIcon />,
                title: 'Distribution & Logistics',
                subtitle: 'Product Movement Tracking',
                description: 'Track batch numbers and destinations, monitor transportation conditions, record delivery timestamps, and enable rapid recall capabilities.',
                details: [
                  'Batch-destination mapping for forward traceability',
                  'Transportation condition monitoring and logging',
                  'Delivery confirmation and timestamp recording',
                  'Rapid recall simulation and execution capability',
                  'Distribution chain visualization and analytics'
                ],
                color: 'teal'
              },
              {
                icon: <AssignmentTurnedInIcon />,
                title: 'Compliance & Reporting',
                subtitle: 'Audit & Documentation',
                description: 'Generate traceability reports, maintain regulatory compliance documentation, track staff training records, and prepare audit-ready documentation.',
                details: [
                  'One-click traceability report generation',
                  'Regulatory compliance documentation library',
                  'Staff training records and certification tracking',
                  'Audit-ready documentation packages',
                  'Compliance gap analysis and remediation tools'
                ],
                color: 'amber'
              }
            ].map((step, index) => (
              <div 
                className={`workflow-item workflow-${step.color}`} 
                key={index}
                onClick={() => toggleWorkflowItem(index)}
              >
                <div className="workflow-card-header">
                  <div className="workflow-title-icon-wrapper">
                    <div className="workflow-icon">
                      {step.icon}
                    </div>
                    <div className="workflow-title">
                      <h3>{step.title}</h3>
                    </div>
                  </div>
                  <div className="workflow-toggle-icon">
                    {activeWorkflowItem === index && showWorkflowModal ? <CloseIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                  </div>
                </div>
                <div className="workflow-content">
                  <p className="workflow-preview">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Modal - Positioned outside sections to avoid blur */}
      {showWorkflowModal && activeWorkflowItem !== null && (
        <div className="workflow-modal-overlay" onClick={closeWorkflowModal}>
          <div 
            className={`workflow-modal workflow-${[
              'blue', 'purple', 'green', 'orange', 'teal', 'amber'
            ][activeWorkflowItem]}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="workflow-modal-header">
              <div className="workflow-icon">
                {[
                  <MenuBookIcon />,
                  <WarehouseIcon />,
                  <BarChartIcon />,
                  <CheckCircleIcon />,
                  <LocalShippingIcon />,
                  <AssignmentTurnedInIcon />
                ][activeWorkflowItem]}
              </div>
              <div className="workflow-title">
                <h3>{[
                  'Receiving & Documentation',
                  'Storage Management',
                  'Production Process',
                  'Quality Assurance',
                  'Distribution & Logistics',
                  'Compliance & Reporting'
                ][activeWorkflowItem]}</h3>
                <h4>{[
                  'Initial Product Entry',
                  'Inventory Tracking',
                  'Recipe & Batch Tracking',
                  'Continuous Monitoring',
                  'Product Movement Tracking',
                  'Audit & Documentation'
                ][activeWorkflowItem]}</h4>
              </div>
              <div className="workflow-modal-close" onClick={closeWorkflowModal}>
                <CloseIcon />
              </div>
            </div>
            <div className="workflow-modal-content">
              <p className="workflow-description">{[
                'Record supplier details, document batch numbers, generate unique product identifiers, and store supplier documentation.',
                'Track product locations, monitor storage conditions, implement FIFO/FEFO inventory management, and receive alerts for approaching expiry dates.',
                'Link ingredients to recipes, record processing parameters, track allergen controls, and maintain equipment records.',
                'Perform regular quality checks, monitor critical control points, document corrective actions, and generate compliance reports.',
                'Track batch numbers and destinations, monitor transportation conditions, record delivery timestamps, and enable rapid recall capabilities.',
                'Generate traceability reports, maintain regulatory compliance documentation, track staff training records, and prepare audit-ready documentation.'
              ][activeWorkflowItem]}</p>
              <div className="workflow-details-container">
                <h5 className="workflow-details-title">Traceability Actions:</h5>
                <ul className="workflow-details">
                  {[
                    [
                      'Capture complete supplier information and certification',
                      'Generate and assign unique batch/lot numbers',
                      'Record product specifications and allergen information',
                      'Store digital copies of supplier documentation',
                      'Validate incoming product against specifications'
                    ],
                    [
                      'Real-time inventory location tracking',
                      'Temperature and humidity monitoring logs',
                      'Automated FIFO/FEFO inventory management',
                      'Expiration date alerts and notifications',
                      'Storage condition compliance verification'
                    ],
                    [
                      'Digital recipe management with version control',
                      'Batch-specific processing parameter recording',
                      'Allergen control procedures and validation',
                      'Equipment maintenance and calibration logs',
                      'Process deviation documentation and corrective actions'
                    ],
                    [
                      'Scheduled quality check procedures and results',
                      'Critical Control Point (CCP) monitoring system',
                      'Corrective action tracking and verification',
                      'Automated compliance report generation',
                      'Quality trend analysis and improvement tracking'
                    ],
                    [
                      'Batch-destination mapping for forward traceability',
                      'Transportation condition monitoring and logging',
                      'Delivery confirmation and timestamp recording',
                      'Rapid recall simulation and execution capability',
                      'Distribution chain visualization and analytics'
                    ],
                    [
                      'One-click traceability report generation',
                      'Regulatory compliance documentation library',
                      'Staff training records and certification tracking',
                      'Audit-ready documentation packages',
                      'Compliance gap analysis and remediation tools'
                    ]
                  ][activeWorkflowItem].map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Food Safety Management?</h2>
          <p>Experience the power of CLEENTRAC and take control of your business operations.</p>
          <a href="mailto:demo@spatrac.co.za?subject=Book%20a%20Call%20Request&body=I'm%20interested%20in%20booking%20a%20call%20with%20CLEENTRAC.%20Please%20contact%20me%20with%20available%20time%20slots." className="cta-button secondary">
            <span>Learn More</span>
            <i className="fas fa-arrow-right"></i>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="logo footer-icon">
                <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
              </svg>
              <span className="logo-text">CLEENTRAC</span>
            </div>
            <div className="footer-text">
              <p>Made with lots of ❤️ and ☕️</p>
              <p className="copyright">2024 CLEENTRAC. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button className="back-to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <ExpandLessIcon />
      </button>
    </div>
  );
};

export default CleentracLandingPage;
