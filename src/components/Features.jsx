import React from 'react';
import '../App.css';

// ============================================================================
// FEATURES SECTION COMPONENT
// ============================================================================
// This section highlights what the application can do.
function Features() {
  // We use a JavaScript array to store our feature data.
  // This makes it easy to add or remove features later without repeating HTML code.
  const featuresList = [
    { title: 'Time Tracking', description: 'Log your study hours easily and stay on top of your schedule.' },
    { title: 'Goal Setting', description: 'Set and reach your daily milestones with intelligent reminders.' },
    { title: 'Progress Analytics', description: 'View beautiful charts of your progress and study habits.' }
  ];

  return (
    <section id="features" className="features-section">
      <h2>Why Choose Smart Study Planner?</h2>
      
      <div className="features-grid">
        {/* 
          We use the .map() function to loop through our featuresList array.
          For each 'feature' in the list, it returns a <div> displaying the title and description.
          The 'key' prop (key={index}) is required by React when making lists, 
          so it can keep track of each individual element.
        */}
        {featuresList.map((feature, index) => (
          <div className="feature-card" key={index}>
            {/* <h3> is a sub-heading */}
            <h3>{feature.title}</h3>
            {/* <p> is a paragraph */}
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
