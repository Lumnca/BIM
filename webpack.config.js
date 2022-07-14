const path = require('path');

module.exports = {
  entry: './src/bundle8.js',
  output: {
      path: path.resolve(__dirname, 'dist'),
    filename: 'bundle8.js'
  },
  mode: 'development'
};