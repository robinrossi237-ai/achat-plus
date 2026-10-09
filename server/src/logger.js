// Mini-logger : en production on ne garde que les erreurs, pour ne pas
// polluer les logs Render. Surcharge via LOG_LEVEL :
// debug < info < warn < error < silent.
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const configured = String(process.env.LOG_LEVEL || '').toLowerCase();
const fallback = process.env.NODE_ENV === 'production' ? 'error' : 'debug';
const current = LEVELS[configured] ?? LEVELS[fallback] ?? LEVELS.debug;

const emit = (level, fn, args) => {
  if (LEVELS[level] >= current) fn(...args);
};

export const logger = {
  debug: (...args) => emit('debug', console.debug, args),
  info: (...args) => emit('info', console.log, args),
  warn: (...args) => emit('warn', console.warn, args),
  error: (...args) => emit('error', console.error, args),
};

export default logger;
