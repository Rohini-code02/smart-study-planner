import React from 'react';
import '../App.css';

// ============================================================================
// FOOTER COMPONENT
// ============================================================================
// This appears at the very bottom of the page.
function Footer() {
  return (
    // <footer> is an HTML tag meant for the bottom section of a webpage.
    <footer className="footer-section">
      {/* &copy; is an HTML entity code that displays the Copyright symbol © */}
      <p>&copy; 2026 Smart Study Planner. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
