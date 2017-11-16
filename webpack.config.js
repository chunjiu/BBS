const path = require('path');
const webpack = require('webpack');
const htmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {//多页面
        document: './views/src/document.js',

    },
    output: {
        path: path.resolve(__dirname, './views/dist'),
        filename: '[name]-[chunkhash].js',
        publicPath:''
    },
    devServer: {
        contentBase: './views/dist',
        compress:true
    },
    module: {
        rules: [
            {
                test: /\.js$/,  //打包js文件
                use: [
                    'babel-loader',
                ],
                exclude: __dirname + './node_modules',//指定不需要转换处理的范围
                include: __dirname + './views/dist',//指定转换处理的范围   
            }, {
                test: /\.css$/, //打包css文件
                use: [
                    'style-loader',//style-loader必须在前面
                    'css-loader',
                ]
            }, {
                test: /\.less$/,//less,同时需要css-loader及style-loader处理
                use: [
                    'style-loader',//style-loader必须在前面
                    'css-loader',
                    'less-loader'
                ]
            }, {
                test: /\.html$/,
                use:'html-loader'
            },
            {
                test: /\.ejs$/,//打包ejs文件
                use: 'ejs-loader',
            }, {
                test: /\.(png|jpg|git|svg)$/i,
                use: [
                    'file-loader',
                ],
            }, 
        ]
    },
    devServer: {
        contentBase: './views/dist',
    },
    plugins: [
        /*new webpack.DefinePlugin({
            'process.env.ASSET_PATH':JSON.stringify(ASSET_PATH)
        }),*/
        new htmlWebpackPlugin({
            template: './views/Template.ejs',
            filename: 'document.ejs',
            inject: 'body',
           /* minify: {
                removeComments: true,//删除注释
                collapseWhitespace: true,//清除空格
            },*/
            chunks: ['document'],
            //excludeChunks:['main','a']//选择除了方框内的 main 和 a 文件
        }),
      
    ]

}