const path = require('path');

module.exports = {
  entry: './src/index.js',

  
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    // clean: true,
  },
  module: {
    rules: [
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
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-react"],
          }
        }
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '*']
  },
};


