// Utility for logging system events or errors to a file or console.
// Use winston
// no daily rotation logs for the project are logs are relatively small
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// const isTestEnv = process.env.NODE_ENV === 'test';
const isTestEnv = false;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return `${timestamp} [${level}]: ${stack || message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

const logger = winston.createLogger({
  level: isTestEnv ? 'silent' : process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: () => new Date().toLocaleString(), // local time
    }),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : logFormat
  ),
  transports: isTestEnv
    ? [] // No logging during test
    : [
        new winston.transports.Console({
          format: combine(colorize(), logFormat),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
  exitOnError: false,
});

export default logger;
