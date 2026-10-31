const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// .reference holds downloaded Ionic sources for parity work (git-ignored); keep Metro out of it.
const config = { resolver: { blockList: [/[\\/]\.reference[\\/].*/] } };

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
