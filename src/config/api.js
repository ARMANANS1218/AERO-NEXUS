// Centralized API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Email Ticketing API base URL - use same as main API URL
export const API_BASE_URL = API_URL;

// Image URLs
export const IMG_PROFILE_URL = `${API_URL}/uploads/profile`;
export const IMG_SCREENSHOT_URL = `${API_URL}/uploads/call-screenshots`;

export default {
  API_URL,
  API_BASE_URL,
  IMG_PROFILE_URL,
  IMG_SCREENSHOT_URL,
};
