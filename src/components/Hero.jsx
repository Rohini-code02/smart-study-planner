import React from 'react';
import '../App.css';

// ============================================================================
// HERO SECTION COMPONENT
// ============================================================================
// This is the first big section users see when they land on the page.
function Hero() {
  return (
    // <section> is an HTML tag for grouping related content.
    // id="home" allows us to link directly to this section from the navbar.
    <section id="home" className="hero-section">
      <div className="hero-content">
        {/* Main heading of the page */}
        <h2>Organize Your Study, Achieve Your Goals</h2>
        
        {/* A simple description paragraph */}
        <p>Smart Study Planner helps you manage your time, track your progress, and get better grades with ease.</p>
        
        {/* Call to action button */}
        <button className="btn-primary">Get Started for Free</button>
      </div>
    </section>
  );
}

// Exporting so App.jsx can import and use it
export default Hero;
