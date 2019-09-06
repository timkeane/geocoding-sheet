const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const Showdown = require('showdown')
Showdown.setFlavor('github')
const converter = new Showdown.Converter()

const helpDir = path.resolve(__dirname, '../gcp/help')
shell.mkdir('-p', helpDir)

fs.readdirSync('.').forEach(mdFile => {
  if (!fs.statSync(mdFile).isDirectory() && mdFile !== 'md2html.js') {
    const helpFile = mdFile.replace(/\.md/, '.html')
    let md = fs.readFileSync(mdFile, {encoding: 'utf-8'})
    md = md.replace(/\.md/g, '.html')
    fs.writeFileSync(`${helpDir}/${helpFile}`, converter.makeHtml(md), {encoding: 'utf-8'})
  }
})
