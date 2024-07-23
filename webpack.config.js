const path = require('path');
const Dotenv = require('dotenv-webpack');


module.exports = {
  entry: {
    main: './public/script.js',
    // Add more entry points if needed
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, './public/')
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    hot: true,
    port: 2026,
  },
  plugins: [
    new Dotenv()
    // Add more plugins if needed
  ]
};
// npx webpack --config webpack.config.js
