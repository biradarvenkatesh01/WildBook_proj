'use strict';
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter on login routes to prevent brute force attacks
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
});

module.exports = {
  loginRateLimiter,
};
