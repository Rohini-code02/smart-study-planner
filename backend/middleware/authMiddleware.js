// ============================================================================
// AUTHENTICATION MIDDLEWARE (authMiddleware.js)
// ============================================================================
//
// WHAT IS MIDDLEWARE?
// ===================
// Imagine a restaurant. When you order food, it goes through several stages:
// 1. Waiter takes your order (Request comes in)
// 2. Chef checks if you have a reservation (Middleware runs)
// 3. Chef prepares your food ONLY if you have a reservation (Route Handler runs)
//
// Middleware works the SAME way in Express. It is a function that runs in the 
// MIDDLE of a request's journey — AFTER the request arrives but BEFORE the 
// final route handler sends back a response.
//
// Every middleware function receives three arguments:
// - req  → The incoming request (contains data from the client/frontend)
// - res  → The outgoing response (we use this to send data BACK to the client)
// - next → A function we MUST call to pass control to the NEXT middleware/route
//
// If we don't call next(), the request will just hang forever and time out!
//
// WHY DO WE NEED AUTH MIDDLEWARE?
// =================================
// Routes like "GET /api/users/me" or "GET /api/tasks" should be PRIVATE.
// Only a logged-in user should be able to access them.
// Without middleware, ANYONE could call those URLs and steal everyone's data!
// Our middleware acts as a security guard that checks for a valid "entry pass" (JWT).

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================================================
// MIDDLEWARE 1: protect
// ============================================================================
// PURPOSE: Verify the user's JWT and attach their data to the request.
//
// HOW JWT VERIFICATION WORKS (The Full Picture):
// ================================================
// 1. USER LOGS IN → Our server creates a JWT containing the user's ID 
//    and signs it with our secret key (JWT_SECRET from .env).
//    The token looks like: "xxxxx.yyyyy.zzzzz" (3 parts separated by dots)
//    Part 1 (Header): Algorithm info
//    Part 2 (Payload): The user's ID and expiry date
//    Part 3 (Signature): A cryptographic fingerprint created with JWT_SECRET
//
// 2. REACT SAVES THE TOKEN → The frontend stores this token (e.g., in localStorage).
//
// 3. REACT MAKES A PRIVATE REQUEST → React sends the token back inside every 
//    request header as: Authorization: "Bearer <token>"
//
// 4. OUR MIDDLEWARE RUNS:
//    a. We extract the token from the header.
//    b. We use jwt.verify() to decode and validate it:
//       - It checks the SIGNATURE using our JWT_SECRET.
//       - If someone tampered with the token, the signature won't match → BLOCKED.
//       - If the token is expired (e.g., 30 days old), → BLOCKED.
//       - If everything is valid, it returns the decoded payload (the user's ID).
//    c. We use that ID to fetch the real user from MongoDB.
//    d. We attach the user to req.user so the route handler can use it.
//    e. We call next() to let the request proceed.
//
const protect = async (req, res, next) => {
  let token;

  // STEP 1: Look for the Authorization header in the incoming request
  // -----------------------------------------------------------------
  // We check two things:
  // a. Does the 'authorization' header even exist?
  // b. Does it start with 'Bearer'? (This is the standard JWT format)
  // Example of a valid header: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    
    try {
      // STEP 2: Extract the raw token from the header
      // -----------------------------------------------------------------
      // req.headers.authorization looks like: "Bearer eyJhbG..."
      // .split(' ') breaks it into an array: ["Bearer", "eyJhbG..."]
      // [1] picks the second element — which is the actual token string
      token = req.headers.authorization.split(' ')[1];

      // STEP 3: Verify the token's authenticity and decode its payload
      // -----------------------------------------------------------------
      // jwt.verify() does TWO things simultaneously:
      // a. It checks the SIGNATURE using our JWT_SECRET to ensure the token 
      //    was definitely created by OUR server and hasn't been tampered with.
      // b. It checks if the token has EXPIRED (we set expiry to '30d' during login).
      // If either check fails, it throws an error which our catch block handles.
      // If both checks pass, it returns the decoded payload: { id: "...", iat: ..., exp: ... }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // STEP 4: Use the decoded user ID to fetch the real user from MongoDB
      // -----------------------------------------------------------------
      // The token payload contains the user's database ID (which we embedded when 
      // we created the token). We use it to look up the full user record.
      // .select('-password') is critical — the minus sign EXCLUDES the password field.
      // We never want the hashed password floating around in our application's memory.
      req.user = await User.findById(decoded.id).select('-password');

      // STEP 5: Handle the edge case where the user no longer exists
      // -----------------------------------------------------------------
      // What if a user was deleted from the database AFTER their token was created?
      // Their token is technically valid, but the user doesn't exist anymore.
      // We must handle this case to prevent errors downstream.
      if (!req.user) {
        return res.status(401).json({
          message: 'The user belonging to this token no longer exists.',
        });
      }

      // STEP 6: Pass control to the actual route handler
      // -----------------------------------------------------------------
      // next() tells Express: "This middleware is done. Move on to the next 
      // function in the chain." The route handler will now run with req.user available.
      next();

    } catch (error) {
      // STEP 7: Handle specific JWT errors with informative messages
      // -----------------------------------------------------------------
      // Instead of one generic "token failed" message, we check exactly WHAT went 
      // wrong and give a clear, specific response. This is very helpful for debugging!
      
      console.error('JWT Verification Error:', error.name, '-', error.message);

      // Error Type 1: The token's expiry date has passed (e.g., older than 30 days)
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Your session has expired. Please log in again.',
        });
      }

      // Error Type 2: The token string is invalid, malformed, or was tampered with
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid token. Please log in again.',
        });
      }

      // Error Type 3: Any other unexpected error
      return res.status(401).json({
        message: 'Not authorized. Token verification failed.',
      });
    }

  } else {
    // STEP 8: No Authorization header found at all
    // -----------------------------------------------------------------
    // If the request doesn't even HAVE an Authorization header, there is no 
    // token to check. We immediately reject the request with a 401 status.
    // HTTP Status 401 = "Unauthorized" (the user is not authenticated)
    return res.status(401).json({
      message: 'Not authorized. No token provided. Please log in first.',
    });
  }
};

// ============================================================================
// MIDDLEWARE 2: adminOnly
// ============================================================================
// PURPOSE: A secondary middleware that runs AFTER protect. It checks if the 
// already-authenticated user has an 'admin' role.
//
// WHY THIS EXISTS:
// Some routes should be accessible only by administrators (e.g., viewing all users, 
// deleting any account). Regular users should be blocked even if they have a valid JWT.
//
// HOW TO USE IT IN ROUTES:
// router.get('/all-users', protect, adminOnly, getAllUsers);
// First 'protect' runs → then 'adminOnly' runs → only then 'getAllUsers' runs.
//
// NOTE: To use this, you would add a 'role' field to your User schema.
// e.g., role: { type: String, default: 'user', enum: ['user', 'admin'] }
const adminOnly = (req, res, next) => {
  // By this point, the 'protect' middleware has already verified the JWT 
  // and attached the real user to req.user. So we can safely check their role.
  if (req.user && req.user.role === 'admin') {
    // User is an admin — allow the request to proceed
    next();
  } else {
    // User is authenticated (valid JWT) but does NOT have admin privileges
    // HTTP Status 403 = "Forbidden" (authenticated but not authorized for THIS action)
    res.status(403).json({
      message: 'Access denied. This route is restricted to administrators only.',
    });
  }
};

// ============================================================================
// EXPORTING THE MIDDLEWARE FUNCTIONS
// ============================================================================
// We export both functions so they can be imported and used in any route file.
// Usage example in a routes file:
//   const { protect, adminOnly } = require('../middleware/authMiddleware');
//   router.get('/profile', protect, myController);
//   router.delete('/user/:id', protect, adminOnly, deleteUserController);
module.exports = { protect, adminOnly };
