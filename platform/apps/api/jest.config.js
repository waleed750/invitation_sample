/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  // Unit specs live next to the source (`*.spec.ts`); end-to-end specs that
  // boot the full app over HTTP are `*.e2e.spec.ts`.
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {tsconfig: '<rootDir>/tsconfig.json'}]
  },
  // Tests consume the shared source directly — no `packages/shared` build
  // needed before `npm test`.
  moduleNameMapper: {
    '^@platform/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^better-auth$': '<rootDir>/src/testing/better-auth-mock.ts',
    '^better-auth/plugins$': '<rootDir>/src/testing/better-auth-mock.ts',
    '^better-auth/node$': '<rootDir>/src/testing/better-auth-mock.ts'
  },
  testEnvironment: 'node',
  // Seeds valid env before any spec import (AppModule validates env at
  // import time via ConfigModule.forRoot). Specs may override per boot.
  setupFiles: ['<rootDir>/src/jest.setup.ts'],
  // Each spec file declares its own env; never leak secrets between workers.
  maxWorkers: '50%'
};
