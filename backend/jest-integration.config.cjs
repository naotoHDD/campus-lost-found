const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/test/**/*.integration-spec.ts'],
  maxWorkers: 1,
};
