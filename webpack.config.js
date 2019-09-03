const Copy = require('copy-webpack-plugin')
const path = require('path')
const copy = new Copy([
  path.resolve(__dirname, 'gcp/appsscript.json')
])
const conf = require('nyc-build-helper').config.defaultWebpackConfig(__dirname)
conf.plugins.push(copy)
conf.entry = {
  'geocoding-sheet': './src/js/index.js'
}
conf.output.path = path.resolve(__dirname, 'dist')
conf.output.filename = 'js/[name].js'
module.exports = conf