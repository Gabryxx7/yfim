/** Fix for: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"  
 * Check https://github.com/vladmandic/face-api/discussions/134 and https://github.com/mswjs/msw/issues/1252 **/
module.exports = {
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /face-api.esm.js/,
        type: 'javascript/esm' 
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ]
  }
};
