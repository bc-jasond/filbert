module.exports = {
  POST_ACTION_REDIRECT_TIMEOUT: 1000,
  FILBERT_SESSION_COOKIE_NAME: 'filbert-session',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY, // Must be 256 bits (32 characters)
  API_URL: process.env.API_URL || 'http://localhost:3001'
};
