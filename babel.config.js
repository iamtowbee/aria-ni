module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin removed - causes worklets dependency issue
      // The app works fine without it for basic usage
      // Uncomment after installing: npm install react-native-worklets
      // 'react-native-reanimated/plugin',
    ],
  };
};
