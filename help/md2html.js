const fs = require('fs')
const path = require('path')
const Showdown = require('showdown')
Showdown.setFlavor('github')
const converter = new Showdown.Converter()

const markdown = fs.readFileSync(path.resolve(__dirname, 'index.md'), {encoding: 'utf-8'})
let html = converter.makeHtml(markdown)

fs.readdirSync(path.resolve(__dirname))
  .filter(file => !isNaN(file.substr(0, 1)))
  .sort()
  .forEach(file => {
    const md = fs.readFileSync(path.resolve(__dirname, file), {encoding: 'utf-8'})
    html +=  `\n<a id="${file}"></a>\n`
    html += converter.makeHtml(md)
  })

html = `<!DOCTYPE html>
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
${html.replace(/href\=\"\.\//g ,'href="#')}
</body>
</html>`

fs.writeFileSync(path.resolve(__dirname, '../gcp/help.html'), html, {encoding: 'utf-8'})
