"use strict";

var path = require("path");

var webpack = require("webpack");

var HtmlWebpackPlugin = require("html-webpack-plugin");

var SpriteLoaderPlugin = require("svg-sprite-loader/plugin");

var VueLoaderPlugin = require("vue-loader/lib/plugin");

var MiniCssExtractPlugin = require("mini-css-extract-plugin");

var OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

var TerserPlugin = require("terser-webpack-plugin");

module.exports = function (env, argv) {
  var isProductionBuild = argv.mode === "production";
  var publicPath = '/ls_course3/';
  var pcss = {
    test: /\.(p|post|)css$/,
    use: [isProductionBuild ? MiniCssExtractPlugin.loader : "vue-style-loader", "css-loader", "postcss-loader"]
  };
  var vue = {
    test: /\.vue$/,
    loader: "vue-loader"
  };
  var js = {
    test: /\.js$/,
    loader: "babel-loader",
    exclude: /node_modules/,
    options: {
      presets: ['@babel/preset-env'],
      plugins: ["@babel/plugin-syntax-dynamic-import"]
    }
  };
  var files = {
    test: /\.(png|jpe?g|gif|woff2?)$/i,
    loader: "file-loader",
    options: {
      name: "[hash].[ext]"
    }
  };
  var svg = {
    test: /\.svg$/,
    use: [{
      loader: "svg-sprite-loader",
      options: {
        extract: true,
        spriteFilename: function spriteFilename(svgPath) {
          return "sprite".concat(svgPath.substr(-4));
        }
      }
    }, "svg-transform-loader", {
      loader: "svgo-loader",
      options: {
        plugins: [{
          removeTitle: true
        }, {
          removeAttrs: {
            attrs: "(fill|stroke)"
          }
        }]
      }
    }]
  };
  var pug = {
    test: /\.pug$/,
    oneOf: [{
      resourceQuery: /^\?vue/,
      use: ["pug-plain-loader"]
    }, {
      use: ["pug-loader"]
    }]
  };
  var config = {
    entry: {
      main: "./src/main.js",
      admin: "./src/admin/main.js"
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "[name].[hash].build.js",
      publicPath: isProductionBuild ? publicPath : "",
      chunkFilename: "[chunkhash].js"
    },
    module: {
      rules: [pcss, vue, js, files, svg, pug]
    },
    resolve: {
      alias: {
        vue$: "vue/dist/vue.esm.js",
        images: path.resolve(__dirname, "src/images")
      },
      extensions: ["*", ".js", ".vue", ".json"]
    },
    devServer: {
      historyApiFallback: true,
      noInfo: false,
      overlay: true
    },
    performance: {
      hints: false
    },
    plugins: [new HtmlWebpackPlugin({
      template: "src/index.pug",
      chunks: ["main"]
    }), new HtmlWebpackPlugin({
      template: "src/admin/index.pug",
      filename: "admin/index.html",
      chunks: ["admin"]
    }), new SpriteLoaderPlugin({
      plainSprite: true
    }), new VueLoaderPlugin()],
    devtool: "#eval-source-map"
  };

  if (isProductionBuild) {
    config.devtool = "none";
    config.plugins = (config.plugins || []).concat([new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"production"'
      }
    }), new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[contenthash].css"
    })]);
    config.optimization = {};
    config.optimization.minimizer = [new TerserPlugin({
      cache: true,
      parallel: true,
      sourceMap: false
    }), new OptimizeCSSAssetsPlugin({})];
  }

  return config;
};