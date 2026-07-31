// ============================================================================
// API BASE URL CONFIGURATION
// ============================================================================
// In development: calls go to http://localhost:5000
// In production (Vercel): calls go to /api (same domain, handled by vercel.json routing)
//
// Vite exposes env variables prefixed with VITE_ via import.meta.env
// We use an empty string '' for production so fetch('/api/...') works on the same host.

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default API_BASE_URL;
