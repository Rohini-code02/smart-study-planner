// ============================================================================
// USER CONTROLLER (userController.js)
// ============================================================================
// Why this file exists:
// The controller is the "brain" of our API. It contains all the actual business 
// logic for what happens when a user signs up or logs in.
// Keeping this code separate from the routes makes our code clean and easy to debug.

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================================================
// HELPER FUNCTION: generateToken
// ============================================================================
// Why this function exists:
// Both the Signup and Login APIs need to create a JWT (JSON Web Token).
// Instead of writing the same token-creation code twice, we put it in one 
// helper function and call it from both places. This is called the DRY principle:
// "Don't Repeat Yourself"
//
// WHY WE USE JWT:
// Traditional web sessions (storing login info in a cookie) don't work well with 
// mobile apps and separate frontend/backend setups. JWT is a modern solution:
// 1. When the user logs in, the SERVER creates a special signed token containing 
//    the user's ID and sends it to the REACT FRONTEND.
// 2. The React app saves this token (e.g., in localStorage).
// 3. On every future request (e.g., "fetch my study plan"), React sends this token 
//    back to the server in a header.
// 4. The server quickly checks the signature to verify the token is genuine 
//    WITHOUT needing to look up a database session. Fast and Stateless!
const generateToken = (id) => {
  // jwt.sign() creates the token:
  // - { id }: The "payload" (the data we embed inside the token).
  // - process.env.JWT_SECRET: Our top-secret key used to digitally sign it.
  // - { expiresIn: '30d' }: The token automatically expires after 30 days for security.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ============================================================================
// CONTROLLER 1: signupUser
// ============================================================================
// Why this function exists:
// This function handles the 'POST /api/users/signup' route. It is triggered 
// when a user submits our React Signup form.
// It validates the data, hashes the password, creates the user, and returns a JWT.
const signupUser = async (req, res) => {
  // STEP 1: Extract data sent from the React frontend
  // The data arrives in req.body because we use express.json() middleware in server.js
  const { name, email, password } = req.body;

  // STEP 2: INPUT VALIDATION
  // Always validate before touching the database!
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // STEP 3: Check if this email is already registered
    // We search the database for an existing user with the same email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // STEP 4: HASH THE PASSWORD (using bcrypt)
    // -----------------------------------------------------------------------
    // WHY WE USE BCRYPT:
    // Never ever store plain-text passwords in the database. If your database 
    // is ever hacked, the attacker would have everyone's passwords!
    // bcrypt "hashes" the password: it converts it into a scrambled, unreadable 
    // string (e.g., "$2a$10$xyz..."). This is a ONE-WAY operation. No one 
    // (not even your own server!) can un-scramble it back to the original.
    // The only way to verify it is to hash the NEW input and compare the hashes.
    // -----------------------------------------------------------------------
    // The "10" is the "salt rounds" - how many times to scramble the password.
    // Higher = more secure, but slower. 10 is the industry-standard sweet spot.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // STEP 5: Save the new user to the MongoDB database
    // We save the HASHED password, never the original!
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // STEP 6: Generate a JWT and send a success response back to React
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id), // Our digital "login key" for the user
      });
    }

  } catch (error) {
    // STEP 7: Error Handling
    // If anything unexpected goes wrong (e.g., database is down), we catch the error
    // and send back a clean 500 (Internal Server Error) message.
    console.error(error);
    res.status(500).json({ message: 'Server error during signup. Please try again.' });
  }
};

// ============================================================================
// CONTROLLER 2: loginUser
// ============================================================================
// Why this function exists:
// This function handles the 'POST /api/users/login' route. It is triggered when 
// a user submits our React Login form.
// It finds the user, compares the password securely, and returns a JWT.
const loginUser = async (req, res) => {
  // STEP 1: Extract data from the request body
  const { email, password } = req.body;

  // STEP 2: Input Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  try {
    // STEP 3: Find the user by their email address
    // We look for a user in the database whose email matches what was typed
    const user = await User.findOne({ email });

    // STEP 4: COMPARE THE PASSWORD (using bcrypt)
    // -----------------------------------------------------------------------
    // bcrypt.compare() takes:
    // 1. 'password': The plain-text password the user just typed in the login form.
    // 2. 'user.password': The scrambled (hashed) password stored in our database.
    // bcrypt internally hashes the typed password and compares the resulting hashes.
    // It returns 'true' if they match, 'false' if they don't.
    // This is why we can verify the password WITHOUT ever decrypting the database one!
    // -----------------------------------------------------------------------
    if (user && (await bcrypt.compare(password, user.password))) {
      // Passwords match! The user is authenticated. Send back the JWT.
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // Email not found OR passwords don't match.
      // We intentionally give a vague error message ("Invalid credentials") for security.
      // If we said "wrong password" vs "email not found", attackers could use that 
      // information to discover which emails are registered in our system.
      res.status(401).json({ message: 'Invalid email or password' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
};

// ============================================================================
// CONTROLLER 3: getUserProfile
// ============================================================================
// Why this function exists:
// Handles 'GET /api/users/me'. It returns the currently logged-in user's info.
// We use this to populate the Profile Page when it loads.
const getUserProfile = async (req, res) => {
  try {
    // The authMiddleware already fetched the user from the database and attached 
    // it to req.user. We just need to find the user again to be safe and 
    // return their current data (excluding the password!).
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// ============================================================================
// CONTROLLER 4: updateUserProfile
// ============================================================================
// Why this function exists:
// Handles 'PUT /api/users/me'. It allows users to change their name or email.
// When the form is submitted on the Profile Page, this code runs.
const updateUserProfile = async (req, res) => {
  try {
    // STEP 1: Find the current user in the database using the ID from the JWT
    const user = await User.findById(req.user._id);

    if (user) {
      // STEP 2: Update the fields. 
      // If the frontend sent a new name, use it. Otherwise, keep the old one.
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      // STEP 3: Save the updated user back to the database
      const updatedUser = await user.save();

      // STEP 4: Send the updated data back to the frontend
      // We also send a fresh token just in case the email changed
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// ============================================================================
// CONTROLLER 5: changeUserPassword
// ============================================================================
// Why this function exists:
// Handles 'PUT /api/users/password'. A separate endpoint just for security.
// It requires the user to type their OLD password before setting a NEW one.
const changeUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Input validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    // STEP 1: Find the user
    const user = await User.findById(req.user._id);

    if (user) {
      // STEP 2: Verify the current password
      // We use bcrypt.compare() to check if the old password they typed matches 
      // the hashed password in the database.
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect current password' });
      }

      // STEP 3: Hash the NEW password
      // We CANNOT save the new password as plain text. We must scramble it first!
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      // STEP 4: Save to database
      await user.save();

      res.status(200).json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

// ============================================================================
// CONTROLLER 6: googleAuthUser
// ============================================================================
// Handles Google Sign-In. Verifies the Google credential token, then either
// creates a new user (first-time sign in) or returns existing user's JWT.
const googleAuthUser = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'No Google credential provided' });
  }
  try {
    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      // New user — create account
      user = await User.create({
        name,
        email,
        googleId,
        avatarUrl: picture || '',
        password: undefined, // Google users don't have a password
      });
    } else if (!user.googleId) {
      // Existing email user — link Google account
      user.googleId = googleId;
      if (!user.avatarUrl) user.avatarUrl = picture || '';
      await user.save();
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// Export all controllers so our routes file can use them
module.exports = { 
  signupUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changeUserPassword,
  googleAuthUser,
};
