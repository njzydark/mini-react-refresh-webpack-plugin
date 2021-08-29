const runtime = require.resolve('./runtime').replace(/\\/g, '/');

const ReactRefreshHotModuleInjection = `
const runtime = require('${runtime}').default;
const exports = module.exports || module.__proto__.exports;
if (module.hot && exports && runtime.isReactRefreshBoundary && runtime.isReactRefreshBoundary(exports)) {
  console.log('%c React Refresh ', 'background:#41b883 ; padding: 1px; border-radius: 3px;  color: #fff', ' start hmr...');
  module.hot.accept();
  runtime.enqueueUpdate();
}
`;

function ReactRefreshHotModuleLoader(source) {
  // @ts-ignore
  this.cacheable();
  return source + ReactRefreshHotModuleInjection;
}

module.exports = ReactRefreshHotModuleLoader;
