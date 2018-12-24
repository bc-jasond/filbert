const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const config = {
    entry: './src/app.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[hash].js'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          use: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [
        '.js',
        '.jsx'
      ]
    },
    devServer: {
      contentBase: './dist',
      host: '0.0.0.0',
      disableHostCheck: true,
      port: isProduction ? 80 : 8080,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
      })
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\\/]node_modules[\\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  }
  return config;
}
