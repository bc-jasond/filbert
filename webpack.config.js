const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const config = {
    entry: './src/index.jsx',
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
        },
        {
          test: /\.woff$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts/',
              }
            }
          ],
          exclude: /node_modules/,
        },
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
      watchContentBase: true,
      historyApiFallback: {
        verbose: true,
        rewrites: [
          {
            from: /\.woff$/,
            to: context => '/fonts/' + context.parsedUrl.pathname.split('/').pop(),
          },
          {
            from: /\.js$/,
            to: context => '/' + context.parsedUrl.pathname.split('/').pop(),
          },
          {
            from: /\//,
            to: '/index.html',
          },
        ],
      },
      port: 8080,
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
