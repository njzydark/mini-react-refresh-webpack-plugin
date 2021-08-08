# mini-react-refresh-webpack-plugin

A mini webpack plugin for react refresh

> This plugin is based on [https://github.com/maisano/react-refresh-plugin](https://github.com/maisano/react-refresh-plugin)

## Motivation

When I use this plugin [pmmmwh/react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin) in my project [chrome-extension-boilerplate](https://github.com/njzydark/chrome-extension-boilerplate), I meet this problem [issues/399](https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/399), It took me a long time to solve this problem on the original repository, and finally I realized I should make a separate version to meet my later needs, such as excluding specific entries, so this version was born

## Usage

```bash
npm i -D @njzy/mini-react-refresh-webpack-plugin
```

webpack config:

```ts
import { MiniReactRefreshWebpackPlugin } from '@njzy/mini-react-refresh-webpack-plugin';

...
plugins: [new MiniReactRefreshWebpackPlugin()]
...
```

**PS:** No need to set `react-refresh/babel`

## Thanks

- [maisano/react-refresh-plugin](https://github.com/maisano/react-refresh-plugin)
- [pmmmwh/react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)
- [react-refresh](https://github.com/facebook/react/tree/main/packages/react-refresh/src)
