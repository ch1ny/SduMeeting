const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	devServer: {
		static: path.join(__dirname, 'public'),
		host: '127.0.0.1',
		port: 9000,
	},
	resolve: {
		extensions: ['.js', '.jsx', '.json'],
		alias: {
			Components: path.join(__dirname, 'src/Components'),
			Views: path.join(__dirname, 'src/Views'),
			Utils: path.join(__dirname, 'src/Utils'),
		},
	},
	entry: {
		login: './src/Views/Login/index.jsx',
		main: './src/Views/Main/index.jsx',
	},
	output: {
		path: path.resolve(__dirname, './build'),
		filename: '[name]/index.[chunkhash:8].js',
	},
	module: {
		rules: [
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					'style-loader',
					'css-loader',
					'resolve-url-loader',
					{
						loader: 'sass-loader',
						options: {
							sourceMap: true,
						},
					},
				],
			},
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-react', '@babel/preset-env'],
						plugins: ['@babel/plugin-proposal-class-properties'],
					},
				},
			},
			{
				test: /\.(png|jpg|gif)$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 1024, //对图片的大小做限制，1kb
						},
					},
				],
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'login/index.html',
			chunks: ['login'],
			template: './public/index.html',
		}),
		new HtmlWebpackPlugin({
			filename: 'main/index.html',
			chunks: ['main'],
			template: './public/index.html',
		}),
	],
};
