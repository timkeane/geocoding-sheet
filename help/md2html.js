const fs = require('fs')
const path = require('path')
const Showdown = require('showdown')
Showdown.setFlavor('github')
const converter = new Showdown.Converter()

const markdown = fs.readFileSync(path.resolve(__dirname, 'index.md'), {encoding: 'utf-8'})
let help = converter.makeHtml(markdown)

fs.readdirSync('.')
  .filter(file => !isNaN(file.substr(0, 1)))
  .sort()
  .forEach(file => {
    const md = fs.readFileSync(file, {encoding: 'utf-8'})
    help +=  `\n<a id="${file}"></a>\n`
    help += converter.makeHtml(md)
  })

help = help.replace(/href\=\"\.\//g ,'href="#')

help = `<!DOCTYPE html>
<html>
<head>
<title>Sheet Geocoder Help</title>
<link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css">
<style>
body {margin: 5px}
</style>
</head>
<body>
<a id="index.md"></a>
${help}
</body>
</html>`

fs.writeFileSync(path.resolve(__dirname, '../gcp/help.html'), help, {encoding: 'utf-8'})
