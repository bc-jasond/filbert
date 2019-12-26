const webpack = require('webpack');
const express = require('express');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const entry = ['@babel/polyfill'];
  if (!isProduction) {
    entry.push('react-hot-loader/patch');
  }
  entry.push('./src/index.jsx');

  const config = {
    mode: isProduction ? 'production' : 'dev',
    entry,
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
                outputPath: 'fonts/'
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.svg$/,
          use: 'svg-react-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    devtool: isProduction ? '' : 'inline-source-map',
    devServer: {
      contentBase: './dist',
      host: '0.0.0.0',
      disableHostCheck: true,
      watchContentBase: true,
      before: app => {
        app.use(express.static('assets'));
      },
      historyApiFallback: {
        disableDotRule: true,
        verbose: true,
        rewrites: [
          {
            from: /\.woff$/,
            to: context =>
              `/fonts/${context.parsedUrl.pathname.split('/').pop()}`
          },
          {
            from: /\.js$/,
            to: context => `/${context.parsedUrl.pathname.split('/').pop()}`
          }
        ]
      },
      port: 8080
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        shouldLoadGoogleAnalytics: false // isProduction,
      }),
      new webpack.DefinePlugin({
        'process.env.API_URL':
          isProduction && !process.env.USE_LOCALHOST_API
            ? "'https://api.filbert.xyz'"
            : "'http://localhost:3001'",
        'process.env.isProduction': isProduction,
        'process.env.GOOGLE_API_FILBERT_CLIENT_ID':
          '"608178004837-u7gj17jvrsuokmkilkaf9qph79p0eojq.apps.googleusercontent.com"'
      })
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  };
  return config;
};
