const target = process.env.API_GATEWAY_URL || 'http://localhost:3000';

module.exports = {
  '/health': {
    target,
    secure: false,
    logLevel: 'debug'
  },
  '/api': {
    target,
    secure: false,
    logLevel: 'debug'
  }
};
