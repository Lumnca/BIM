const path = require('path');

module.exports = {
  entry: './src/bundle9.js',
  output: {
      path: path.resolve(__dirname, 'dist'),
    filename: 'bundle9.js'
  },
  mode: 'development'
};