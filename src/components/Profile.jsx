import React, { useState, useEffect } from 'react';
import './Profile.css';

// ============================================================================
// PROFILE COMPONENT
// ============================================================================
// Why this page exists:
// Users need a central, private place to manage their personal account details, 
// update their preferences, and securely log out of the application.
function Profile({ setCurrentPage, token, handleSetToken }) {
  
  // ==========================================================================
  // STATE MANAGEMENT (useState)
  // ==========================================================================

  // Why this state exists:
  // We need to securely store the user's name so we can display it. 
  // By using state, we allow the user to instantly update their name on screen.
  const [name, setName] = useState('Loading...');

  // Why this state exists:
  // Stores the user's email address.
  const [email, setEmail] = useState('Loading...');

  // State to handle password changes
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Status message for feedback
  const [message, setMessage] = useState('');

  // Why this state exists:
  // This is a boolean (true/false) that tracks if the user is currently 
  // trying to edit their profile. If true, we show editable text inputs. 
  // If false, we just show the normal text. This is called Conditional Rendering!
  const [isEditing, setIsEditing] = useState(false);

  // Fetch the user's profile when the component loads
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setName(data.name);
          setEmail(data.email);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  // ==========================================================================
  // EVENT HANDLERS (Functions)
  // ==========================================================================

  // Why this function exists:
  // Toggles the isEditing state back and forth. 
  // If they are editing, it saves the changes via API. 
  const handleEditProfile = async () => {
    if (isEditing) {
      // Save changes
      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, email })
        });
        const data = await response.json();
        if (response.ok) {
          setMessage("Profile updated successfully!");
          setIsEditing(false);
        } else {
          setMessage(data.message || "Failed to update profile.");
        }
      } catch (error) {
        setMessage("Could not connect to the server.");
      }
    } else {
      setIsEditing(true);
      setMessage('');
    }
  };

  // Why this function exists:
  // Submits a password change request to the backend.
  const submitChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Password updated successfully!");
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMessage(data.message || "Failed to update password.");
      }
    } catch (error) {
      setMessage("Could not connect to the server.");
    }
  };

  const handleChangePasswordClick = () => {
    setIsChangingPassword(!isChangingPassword);
    setMessage('');
  };

  // When the user clicks Logout, we must return them to the public 'home' page.
  // We also must clear their authentication token!
  const handleLogout = () => {
    handleSetToken(null);
    setCurrentPage('home');
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        
        {/* ===================== PROFILE PICTURE ===================== */}
        {/* 
          Why this section exists:
          Avatars personalize the app and make it feel like it truly belongs 
          to the user. We use a free placeholder API to generate a cute avatar.
        */}
        <div className="profile-header">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
            alt="Profile Avatar" 
            className="profile-picture"
          />
          <h2>My Account</h2>
        </div>

        {message && <p style={{textAlign: 'center', marginBottom: '15px', color: message.includes('success') ? 'green' : 'red'}}>{message}</p>}

        {/* ===================== USER DETAILS SECTION ===================== */}
        {/* 
          Why this section exists:
          Displays the core information about the user. We use a ternary operator (?) 
          to smoothly switch between a clean text display and editable input fields.
        */}
        <div className="profile-details">
          
          <div className="detail-group">
            <label>Full Name</label>
            {isEditing ? (
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="profile-input"
              />
            ) : (
              <p className="profile-text">{name}</p>
            )}
          </div>

          <div className="detail-group">
            <label>Email Address</label>
            {isEditing ? (
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="profile-input"
              />
            ) : (
              <p className="profile-text">{email}</p>
            )}
          </div>

          {/* Conditional rendering for password change form */}
          {isChangingPassword && (
            <div style={{marginTop: '20px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px'}}>
              <h4>Change Password</h4>
              <div className="detail-group" style={{marginTop: '10px'}}>
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="profile-input"
                />
              </div>
              <div className="detail-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="profile-input"
                />
              </div>
              <button onClick={submitChangePassword} style={{padding: '8px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px'}}>
                Submit Password Change
              </button>
            </div>
          )}

        </div>

        {/* ===================== ACTION BUTTONS ===================== */}
        {/* 
          Why this section exists:
          Provides the user with clearly labeled buttons for all the administrative 
          actions they can take regarding their account.
        */}
        <div className="profile-actions">
          
          {/* 
            Edit Profile Button 
            Notice how the text inside the button dynamically changes based on 
            whether isEditing is true or false!
          */}
          <button className="btn-profile edit" onClick={handleEditProfile}>
            {isEditing ? "💾 Save Changes" : "✏️ Edit Profile"}
          </button>

          {/* Change Password Button */}
          <button className="btn-profile password" onClick={handleChangePasswordClick}>
            {isChangingPassword ? "❌ Cancel Password Change" : "🔒 Change Password"}
          </button>

          {/* Logout Button */}
          <button className="btn-profile logout" onClick={handleLogout}>
            🚪 Logout
          </button>

        </div>
        
      </div>
    </div>
  );
}

export default Profile;
