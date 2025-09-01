const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      // Redirect module resolution for problematic packages
      'idb': path.resolve(__dirname, 'node_modules/idb'),
      'wrap-idb-value': path.resolve(__dirname, 'node_modules/idb/build')
    },
    // Ensure proper resolution of React Native Firebase modules
    resolverMainFields: ['react-native', 'browser', 'main']
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
