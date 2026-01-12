// This middleware logs each incoming request (method, path, status code, etc.).
import logger from '../utils/logger.js';

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userId: req.user?.id ?? null,
    });
  });

  next();
};

export default loggerMiddleware;
