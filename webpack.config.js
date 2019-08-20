const webpack = require("webpack");
const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "advanced-search.js",
    library: "advancedSearch",
    libraryTarget: "umd"
  }
};
