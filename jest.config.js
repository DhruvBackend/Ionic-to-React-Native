module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // __tests__/helpers holds shared test code, not test files.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/helpers/'],
  // .reference holds downloaded Ionic sources for parity work (git-ignored).
  modulePathIgnorePatterns: ['<rootDir>/.reference/', '<rootDir>/parity/reference/work/'],
  // The preset only transpiles react-native and @react-native/* packages; these ship ES modules too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-svg)/)',
  ],
};
