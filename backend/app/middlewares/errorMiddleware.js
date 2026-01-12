// This middleware catches and handles all API errors in a unified format.
import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  logger.error('Unhandled exception', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id ?? null,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export default errorMiddleware;

// ERROR MIDDLEWAREs ARE NOT USED AS THEY REQUIRE ROUTES TO CHANGED, AND I DO NOT WANT TO MESS WITH THEM
