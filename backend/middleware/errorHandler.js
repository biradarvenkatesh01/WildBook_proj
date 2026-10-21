'use strict';

/**
 * Central error-handling middleware.
 * Must be the last app.use() in server.js.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Never leak stack traces in production
  const body = {
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(status).json(body);
}

module.exports = errorHandler;
