const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { getBundleModeMetroConfig } = require('react-native-worklets/bundleMode');

const config = getDefaultConfig(__dirname);
// Expo SQLite na prévia web usa WASM e memória compartilhada.
config.resolver.assetExts.push('wasm');
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  return (request, response, done) => {
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return next(request, response, done);
  };
};
const packagesRoot = path.resolve(__dirname, '../../packages') + path.sep;
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  let target = moduleName;
  // Os pacotes ESM publicam fontes TS com extensões .js nos imports.
  if (
    context.originModulePath.startsWith(packagesRoot) &&
    moduleName.startsWith('.') &&
    moduleName.endsWith('.js')
  ) {
    const source = path.resolve(
      path.dirname(context.originModulePath),
      moduleName.slice(0, -3) + '.ts',
    );
    if (source.startsWith(packagesRoot) && fs.existsSync(source)) target = source;
  }
  return resolveRequest
    ? resolveRequest(context, target, platform)
    : context.resolveRequest(context, target, platform);
};
module.exports = getBundleModeMetroConfig(config);
