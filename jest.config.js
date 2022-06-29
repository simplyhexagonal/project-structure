const path = require('path');

module.exports = {
  displayName: 'project-structure',
  testEnvironment: 'node',
  verbose: true,
  testRegex: 'src/.*\\.test\\.(ts|js)$',
  transform: {
    '\\.ts': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 30000,
  globals: {
    extensionsToTreatAsEsm: ['.ts', '.js'],
    'ts-jest': {
      // Without this, you git really frustrating errors.
      useESM: true,
    }
  },
  // This preset is absurdly important and was really great to discover!
  preset: 'ts-jest/presets/js-with-ts-esm',
  // Also important to not have anything in here
  transformIgnorePatterns: [],
  testPathIgnorePatterns:[
    "/node_modules/",
    "dist"
  ],
  moduleNameMapper: {
    chalk: require.resolve("chalk"),
    "#ansi-styles": path.join(
      require.resolve("chalk").split("source")[0],
      "source/vendor/ansi-styles/index.js",
    ),
    "#supports-color": path.join(
      require.resolve("chalk").split("source")[0],
      "source/vendor/supports-color/index.js",
    ),
  }
};
