const dotenv = require('dotenv')
dotenv.config()
const fs = require('fs')
const path = require('path')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { google } = require('googleapis')
const drive = google.drive('v3')

function ok(str) {
  return str !== null && str !== undefined && str.trim().length > 0
}

const gsFile = new GoogleSpreadsheet(process.env.DA_GS_FILE_ID)
gsFile.useApiKey(process.env.GOOGLE_SHEET_API_KEY)

async function downloadDriveFile(driveID, destFileName) {
  console.info('Download file', driveID, 'to', destFileName)
  const stream = await drive.files.get({ fileId: driveID, alt: 'media' }, {responseType: 'stream'})

  let type = stream.headers['content-type'].split('/')[1]
  if(type === 'jpeg'){
    type = 'jpg'
  } else if(!type) {
    type = 'txt'
  }
  destFileName += '.' + type

  const dest = fs.createWriteStream(path.resolve(__dirname, '../stage-import-doki' destFileName))
  stream.data.pipe(dest)

  return destFileName
}

async function importDoki() {
  console.info('Import files from Dokidoki Archive...')
  await gsFile.loadInfo()

  let rows = await gsFile.sheetsById[process.env.DA_SHEET_ID].getRows()
  rows = rows.filter(row => row.ioid && row.mainFile).map(row => ({
    ioid: row.ioid,
    mailFile: row.mainFile
  }))
  console.info('Total', rows.length, 'rows')

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, process.env.KEY_PATH),
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  })
  google.options({ auth })

  const list = require('./import-doki-imported.json')
  console.info(list.length, 'files already imported')
  let newImportCount = 0

  for(let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const ioid = row.ioid
    const driveID = row.mailFile.split('?id=')[1]
    if(!list.some(f => f.includes(ioid))) {
      const fileName = await downloadDriveFile(driveID, ioid)
      list.push(fileName)
      newImportCount += 1
    } else {
      console.info(ioid, 'skipped')
    }
  }

  console.info(newImportCount, 'new files imported')
  console.info(list.length, 'total files imported')
  fs.writeFileSync(path.resolve(__dirname, '../data', 'import-doki-imported.json'), JSON.stringify(list))
}

importDoki()
