'use strict';

/**
 * requireRole middleware factory
 * Ensures authenticated user has one of the allowed roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

/**
 * requireApprovedAdmin middleware
 * Ensures user is an ADMIN with account_status === 'APPROVED'.
 */
function requireApprovedAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access restricted to sanctuary administrators.' });
  }

  if (req.user.account_status === 'PENDING') {
    return res.status(403).json({
      status: 'PENDING',
      error: 'Your sanctuary admin account is currently under review.',
    });
  }

  if (req.user.account_status === 'REJECTED') {
    return res.status(403).json({
      status: 'REJECTED',
      error: 'Your sanctuary admin account registration was rejected.',
      review_note: req.user.review_note || null,
    });
  }

  if (req.user.account_status === 'SUSPENDED') {
    return res.status(403).json({
      status: 'SUSPENDED',
      error: 'Your sanctuary admin account has been suspended by the authority.',
      review_note: req.user.review_note || null,
    });
  }

  if (req.user.account_status !== 'APPROVED') {
    return res.status(403).json({ error: 'Admin account is not active.' });
  }

  next();
}

module.exports = {
  requireRole,
  requireApprovedAdmin,
};
