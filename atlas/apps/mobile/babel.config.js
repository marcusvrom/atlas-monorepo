module.exports = function (api) {
  const isWeb = api.caller((caller) => caller?.platform === 'web');
  return {
    presets: [['babel-preset-expo', { reanimated: false, worklets: false }]],
    plugins: [['react-native-worklets/plugin', { bundleMode: !isWeb, strictGlobal: true }]],
  };
};
