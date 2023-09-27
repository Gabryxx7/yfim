/** Fix for: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"  
 * Check https://github.com/vladmandic/face-api/discussions/134 and https://github.com/mswjs/msw/issues/1252 **/
 const path = require('path');
 const CWD = process.cwd();

module.exports = {
  mode: 'development',
  resolve: {
    fullySpecified: false,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '...'],
    fallback: {
        "fs": false
    },
  },
  module: {
    unknownContextCritical: false,
    rules: [
      // {   
      //   test: /\.scss$/,
      //   use: ['style-loader', 'css-loader', 'sass-loader'],
      //   exclude: /node_modules/,
      // },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            // options: {
            //   sourceMap: true,
            //   modules: true,
            // },
          },
          { 
            loader: 'sass-loader',
            // options: {
            //   sassOptions: {
            //       includePaths: [path.resolve(CWD, 'src/styles')]
            //   }
            // }
          },
        ],
      },
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
        use: ["babel-loader"],
        resolve: {
          fullySpecified: false,
        }
      },
      {
        use: ['babel-loader'],
        exclude: /node_modules/,
        test: /\.(js|jsx)$/,
        resolve: {
          fullySpecified: false,
        }
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
      }
    ]
  }
};
