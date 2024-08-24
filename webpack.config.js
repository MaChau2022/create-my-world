const path = require('path');
let Webpack = require('webpack');
let HtmlWebpackPlugin=require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    mode: "development",
    output: {
        filename: 'bundle.[hash:4].js',
        path: path.resolve('dist')
    },
    devServer: {
        historyApiFallback: true,
        port: 3000,
        open: false,
    },
    resolve: {
        extensions: ['.js', '.json', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: /node_modules/,
            use: { loader: 'ts-loader' }, 
        },
        {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
        },
        {
            test: /\.(svg|jpg|gif|png)/,
            use: ['file-loader']
        },
      ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            hash: true,  
        }),
    ]
};
