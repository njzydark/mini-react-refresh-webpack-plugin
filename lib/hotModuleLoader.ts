// copied from https://github.dev/pmmmwh/react-refresh-webpack-plugin/blob/main/loader/index.js

import { SourceMapConsumer, SourceNode } from 'source-map';

import { getIdentitySourceMap } from './utils/getIdentitySourceMap';

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

function ReactRefreshHotModuleLoader(source, inputSourceMap, meta) {
  // @ts-ignore
  this.cacheable();

  // @ts-ignore
  const callback = this.async();

  /**
   * @this {import('webpack').loader.LoaderContext}
   * @param {string} source
   * @param {import('source-map').RawSourceMap} [inputSourceMap]
   * @returns {Promise<[string, import('source-map').RawSourceMap]>}
   */
  async function _loader(source, inputSourceMap) {
    // @ts-ignore
    if (this.sourceMap) {
      let originalSourceMap = inputSourceMap;
      if (!originalSourceMap) {
        // @ts-ignore
        originalSourceMap = getIdentitySourceMap(source, this.resourcePath);
      }

      return SourceMapConsumer.with(originalSourceMap, undefined, consumer => {
        const node = SourceNode.fromStringWithSourceMap(source, consumer);

        node.add(['\n\n', ReactRefreshHotModuleInjection]);

        const { code, map } = node.toStringWithSourceMap();
        return [code, map.toJSON()];
      });
    } else {
      return [[source, ReactRefreshHotModuleInjection].join('\n\n'), inputSourceMap];
    }
  }

  // @ts-ignore
  _loader.call(this, source, inputSourceMap).then(
    ([code, map]) => {
      callback(null, code, map, meta);
    },
    error => {
      callback(error);
    }
  );
}

module.exports = ReactRefreshHotModuleLoader;
