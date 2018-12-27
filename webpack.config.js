const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require("webpack")

module.exports = {
  entry: {
	c3photocrop: './src/index.js'
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
	new webpack.BannerPlugin(' photocrop.js \n by fengshangbin 2018-12-27 \n https://github.com/fengshangbin/PhotoCrop \n H5 Photo Crop Component')
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
	library: 'C3PhotoCrop'
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
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
			{
			  loader: 'url-loader',
			  options: {
			    limit: 8192
			  }
			}
          ]
        }
		  
	  ]
  },
  target: 'web',
  mode: "production"
};