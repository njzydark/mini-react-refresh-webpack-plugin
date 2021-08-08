import { Compiler, RuleSetRule, WebpackPluginInstance } from 'webpack';

type PluginOptions = {
  entryNames?: string[];
  exclude?: RegExp[];
};

export class MiniReactRefreshWebpackPlugin implements WebpackPluginInstance {
  name: string;
  options?: PluginOptions;

  constructor(options?: PluginOptions) {
    this.name = MiniReactRefreshWebpackPlugin.name;
    this.options = options;
  }

  apply(compiler: Compiler) {
    const {
      EntryPlugin,
      javascript: { JavascriptModulesPlugin }
    } = compiler.webpack;

    const { options } = compiler;

    if (process.env.NODE_ENV === 'production' || options.mode !== 'development') {
      return;
    }

    const exclude = this.options?.exclude;

    const moduleRules = options.module.rules;

    const newRule: RuleSetRule = {
      exclude: filePath => {
        if (/(node_modules)/.test(filePath)) {
          return true;
        }
        if (exclude) {
          return exclude.some(item => item.test(filePath));
        }
        return false;
      },
      test: /\.(js|ts)x?$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: [require.resolve('react-refresh/babel')]
          }
        }
      ]
    };

    if (moduleRules.length > 0) {
      moduleRules.push(newRule);
    }

    const entryNames = this.options?.entryNames || [];

    if (entryNames.length === 0) {
      new EntryPlugin(compiler.options.context as string, require.resolve('./runtime'), {
        name: undefined
      }).apply(compiler);
    } else {
      entryNames.forEach(name => {
        new EntryPlugin(compiler.options.context as string, require.resolve('./runtime'), {
          name
        }).apply(compiler);
      });
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap(this.name, (_, module) => {
        if (/\.(jsx|tsx)$/.test(module.resource) && !/node_modules/.test(module.resource)) {
          if (exclude && exclude.some(item => item.test(module.resource))) {
            return;
          }
          module.loaders.unshift({
            loader: require.resolve('./hotModuleLoader'),
            options: {},
            ident: null,
            type: null
          });
        }
      });

      compilation.hooks.beforeModuleIds.tap(this.name, modules => {
        for (const module of modules) {
          // @ts-ignore
          if (module.rawRequest === 'react-refresh/runtime') {
            module.id = '$refreshRuntime';
          }
        }
      });

      const { mainTemplate } = compilation;

      const JavascriptModulesHooks = JavascriptModulesPlugin.getCompilationHooks(compilation);

      mainTemplate.hooks.localVars.tap(this.name, (source, chunk, hash) => {
        // if (context && exclude && exclude.some(item => item.test(context))) {
        //   return source;
        // }
        return [
          source,
          'function setupReactRefreshForModule(moduleId) {',
          '  // "react-refresh/runtime" has not yet executed',
          `  var runtime = __webpack_require__.$refreshRuntime();`,
          '  if (runtime === undefined) {',
          '    return function() {};',
          '  }',
          '  var prevRefreshReg = window.$RefreshReg$;',
          '  var prevRefreshSig = window.$RefreshSig$;',
          '  window.$RefreshReg$ = function(type, id) {',
          '    const fullId = moduleId + " " + id;',
          `    runtime.register(type, fullId);`,
          '  };',
          '  window.$RefreshSig$ = runtime.createSignatureFunctionForTransform;',
          '  return function resetReactRefreshGlobals() {',
          '    window.$RefreshReg$ = prevRefreshReg;',
          '    window.$RefreshSig$ = prevRefreshSig;',
          '  }',
          '}'
        ].join('\n');
      });

      mainTemplate.hooks.requireExtensions.tap(this.name, (source, chunk) => {
        return (
          source +
          [
            '\n\n',
            `__webpack_require__.$refreshRuntime = function () {`,
            '  // This function only returns the exports of the runtime wrapper',
            '  // once the module has finished executing.',
            `  if (__webpack_require__.c && __webpack_require__.c.$refreshRuntime && __webpack_require__.c.$refreshRuntime.loaded) {`,
            `    return __webpack_require__.c.$refreshRuntime.exports;`,
            '  }',
            '};'
          ].join('\n')
        );
      });

      JavascriptModulesHooks.renderRequire.tap(this.name, (source, renderContext) => {
        const lines = source.split('\n');

        const moduleInitializationLineNumber = lines.findIndex(line => {
          return line.includes('execOptions.factory.call');
        });

        if (moduleInitializationLineNumber === -1) {
          return source;
        }

        lines.splice(
          moduleInitializationLineNumber,
          1,
          'var cleanup = setupReactRefreshForModule ? setupReactRefreshForModule(module.id) : () => {};',
          'try {',
          '  ' + lines[moduleInitializationLineNumber],
          '} finally {',
          '  cleanup();',
          '}'
        );

        return lines.join('\n');
      });
    });
  }
}
