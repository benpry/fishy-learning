/** @param {import("webpack").Configuration} config */
export function webpack(config) {
  config.module.rules.push({
    test: /\.html$/i,
    loader: "html-loader",
  });

  return config;
}

/** @param {import("webpack-dev-server").Configuration} devServerConfig */
export function webpackDevServer(devServerConfig) {
  return devServerConfig;
}
