import logger from '../utils/logger.js';

const requestLogger = (req, res, next) => {
  const user = req.user ? ` (User: ${req.user.id})` : '';
  logger.info(`${req.method} ${req.url}${user}`);
  next();
};

export default requestLogger;
