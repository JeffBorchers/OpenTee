// OpenTee Landing Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Waitlist form elements
  const waitlistForm = document.getElementById('waitlist-form');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const emailInput = document.getElementById('email');
  
  // Mobile menu elements
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  // ============ Mobile Menu Toggle ============
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      });
    });
  }
  
  // ============ Smooth Scroll ============
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // ============ Waitlist Form Submission ============
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      
      // Reset states
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
      
      // Client-side validation
      if (!email) {
        showError('Please enter your email address.');
        return;
      }
      
      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      
      // Disable submit button
      const submitBtn = waitlistForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Joining...';
      
      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Success
          successMessage.style.display = 'flex';
          waitlistForm.style.display = 'none';
          emailInput.value = '';
        } else {
          // Error from server
          showError(data.error || 'Something went wrong. Please try again.');
        }
      } catch (err) {
        console.error('Waitlist submission error:', err);
        showError('Unable to connect. Please check your connection and try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  // Email validation helper
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Show error message helper
  function showError(message) {
    errorMessage.querySelector('p').textContent = message;
    errorMessage.style.display = 'block';
  }
  
  // ============ Navbar Background on Scroll ============
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 50) {
        navbar.style.background = 'rgba(26, 58, 42, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      } else {
        navbar.style.background = 'rgba(26, 58, 42, 0.95)';
        navbar.style.boxShadow = 'none';
      }
      
      lastScroll = currentScroll;
    });
  }
  
  // ============ Fade-in Animations on Scroll ============
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements for fade-in animation
  const animateElements = document.querySelectorAll(
    '.step-card, .feature-card, .pricing-card, .problem-stats .stat, .problem-narrative'
  );
  
  animateElements.forEach((el, index) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${index * 0.1}s`;
    fadeObserver.observe(el);
  });
  
  // ============ Clock Animation (subtle) ============
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');
  
  if (hourHand && minuteHand) {
    // Subtle tick animation
    setInterval(() => {
      const now = new Date();
      const minutes = now.getMinutes();
      const minuteDegrees = (minutes / 60) * 360;
      minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
    }, 60000); // Update every minute
  }
  
  // ============ Form Input Focus Effects ============
  const formInputs = document.querySelectorAll('.form-group input');
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
    });
  });
  
  // ============ Keyboard Navigation ============
  document.addEventListener('keydown', (e) => {
    // ESC closes mobile menu
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
    }
  });
  
  // ============ Active Section Highlighting ============
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${id}`) {
            item.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });
  
  sections.forEach(section => {
    sectionObserver.observe(section);
  });
});

// ============ Utility: Debounce ============
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============ Utility: Throttle ============
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
