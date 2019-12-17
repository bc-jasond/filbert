const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (/*env, argv*/) => {
  const entry = ['@babel/polyfill'];
  entry.push('./src/index-prod.jsx');

  const config = {
    mode: 'production',
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
    devtool: '',
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        shouldLoadGoogleAnalytics: false // isProduction,
      }),
      new webpack.DefinePlugin({
        'process.env.API_URL': "'https://api.filbert.xyz'",
        'process.env.isProduction': true
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
  };
  return config;
};
