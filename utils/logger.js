/**
 * NEON21 — Logger
 * Structured logging for the engine and API layer
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatMessage(level, module, message, data) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] [${module}] ${message}`;
  if (data !== undefined) {
    try {
      return base + ' ' + JSON.stringify(data);
    } catch {
      return base + ' [unserializable data]';
    }
  }
  return base;
}

function log(level, module, message, data) {
  if (LOG_LEVELS[level] < currentLevel) return;
  const line = formatMessage(level, module, message, data);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/**
 * Create a scoped logger for a specific module
 */
function createLogger(module) {
  return {
    debug: (msg, data) => log('debug', module, msg, data),
    info:  (msg, data) => log('info',  module, msg, data),
    warn:  (msg, data) => log('warn',  module, msg, data),
    error: (msg, data) => log('error', module, msg, data)
  };
}

module.exports = { createLogger, log };
