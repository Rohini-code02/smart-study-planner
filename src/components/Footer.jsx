import React from 'react';
import '../App.css';

function Footer() {
  return (
    <footer id="contact" className="footer-section">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>Smart Study Planner</h3>
          <p>Helping students achieve their academic potential.</p>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }); }}>Home</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>About</a></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>📧 support@smartstudyplanner.com</p>
          <p>Built with ❤️ for students</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Smart Study Planner. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
