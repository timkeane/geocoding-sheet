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
img {cursor: pointer; width: calc(100% - 10px)}
</style>
</head>
<body>
<a id="index.md"></a>
${html.replace(/href\=\"\.\//g ,'href="#')}
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script>
$('img').click(function() {
  var win = window.open();
  win.document.write('<img src="' + this.src + '" alt="' + this.alt + '">');
});
$('img').each(function() {
  this.alt = this.alt || '';
  this.alt = this.alt + ' (click to enlarge)';
  this.title = this.alt;
});
</script>
</body>
</html>`

fs.writeFileSync(path.resolve(__dirname, '../gcp/help.html'), html, {encoding: 'utf-8'})
