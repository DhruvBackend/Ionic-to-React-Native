const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// .reference holds downloaded Ionic sources for parity work (git-ignored); keep Metro out of it.
// parity/reference/work is the copied Ionic project + its node_modules (git-ignored).
const config = {
  resolver: { blockList: [/[\\/]\.reference[\\/].*/, /[\\/]parity[\\/]reference[\\/]work[\\/].*/] },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
