const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ioidFileNameRegex = /^X-[0-9A-Z]{4}-[0-9A-Z]{4}/

async function make() {
  const srcDir = path.resolve(__dirname, '../files')
  const destDir = path.resolve(__dirname, '../thumbs')
  const types = ['png', 'jpg']
  const thumbNames = fs.readdirSync(destDir).filter(f => f.match(ioidFileNameRegex))
  let fileNames = fs.readdirSync(srcDir).filter(f => f.match(ioidFileNameRegex) && types.includes(f.split('.')[1]))
  console.info(fileNames.length, 'files to make thumbs', thumbNames.length, 'thumbs')
  
  if(skipExisting) {
    const x = fileNames.length
    fileNames = fileNames.filter(f => !thumbNames.includes(f))
    console.info('Skip', x - fileNames.length, 'files')
  }
  console.info('Making', fileNames.length, 'thumbs' + (fileNames.length > 0 ? '...' : ''))

  for(let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i]
    await sharp(path.resolve(srcDir, fileName)).extract({ left: 48, top: 48, width: 400, height: 400 }).toFile(path.resolve(destDir, fileName))
  }
}

const skipExisting = true
make()
