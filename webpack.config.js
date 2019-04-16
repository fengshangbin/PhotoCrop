const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
//const ZopfliWebpackPlugin = require('zopfli-webpack-plugin');
const webpack = require('webpack');

let common = {
  //mode: 'production', //development, production
  entry: {
    c3photocrop: './index.js'
  },
  plugins: [new CleanWebpackPlugin(['dist']), new webpack.BannerPlugin(' c3photocrop.js \n by fengshangbin 2018-12-27 \n https://github.com/fengshangbin/PhotoCrop \n H5 Photo Crop Component')],
  devServer: {
    contentBase: './examples',
    inline: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      },
      {
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src']
          }
        }
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].js',
    libraryTarget: 'umd',
    //libraryExport: 'default',
    library: 'C3PhotoCrop' // This is the var name in browser
  }
};

/* if (process.env.NODE_ENV === 'production') {
  common.plugins.push(
    new ZopfliWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'zopfli',
      test: /\.(js|html)$/,
      threshold: 10240,
      minRatio: 0.8
    })
  );
} */
module.exports = common;
/* module.exports = function(mode) {
  return [
    Object.assign({}, common, {
      target: 'node',
      output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        filename: '[name].js',
        libraryTarget: 'umd'
      },
      externals: {
        C3PhotoCrop: 'umd jquery'
      }
    }),
    Object.assign({}, common, {
      target: 'web',
      output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        filename: '[name].min.js',
        libraryTarget: 'umd',
        library: 'C3PhotoCrop' // This is the var name in browser
      }
    })
  ];
}; */
