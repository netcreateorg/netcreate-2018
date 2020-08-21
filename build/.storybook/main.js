const path = require("path");

module.exports = {
  "stories": [
    "../app/**/*.stories.js"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  "webpackFinal": (config) => {
    config.resolve.modules.push(
      path.resolve(__dirname, '../app/')
    );
    return config;
  }
}
