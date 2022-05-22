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
		extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
		alias: {
			Components: path.join(__dirname, 'src/Components'),
			Views: path.join(__dirname, 'src/Views'),
			Utils: path.join(__dirname, 'src/Utils'),
		},
	},
	entry: {
		login: './src/Views/Login/index.tsx',
		main: './src/Views/Main/index.tsx',
		register: './src/Views/Register/index.tsx',
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
				test: /\.tsx?$/,
				exclude: /(node_modules|bower_components)/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
			{
				test: /\.(png|jpg|gif|mp3)$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 1024, //对文件的大小做限制，1kb
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
		new HtmlWebpackPlugin({
			filename: 'register/index.html',
			chunks: ['register'],
			template: './public/index.html',
		}),
	],
};
