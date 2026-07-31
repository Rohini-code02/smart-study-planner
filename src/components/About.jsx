import React from 'react';
import '../App.css';

// ============================================================================
// ABOUT SECTION COMPONENT
// ============================================================================
// This section tells the user more about the product or the team behind it.
function About() {
  return (
    <section id="about" className="about-section">
      <h2>About Us</h2>
      
      <div className="about-content">
        <p>
          We are a team of passionate developers and educators. 
          Our mission is to help students around the world achieve their academic potential 
          by providing the best planning and organization tools.
        </p>
      </div>
    </section>
  );
}

export default About;
