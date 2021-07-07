const dotenv = require('dotenv')
dotenv.config()
const fs = require('fs')
const { COPYFILE_EXCL } = fs.constants
const path = require('path')
const { utimes } = require('utimes')
const { GoogleSpreadsheet } = require('google-spreadsheet')

const wait = s => new Promise(resolve => setTimeout(resolve, s * 1000))

function datetime(date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = date.getHours()
  const mm = ('0' + date.getMinutes()).slice(-2)
  const ss = ('0' + date.getSeconds()).slice(-2)
  return `${y}/${m}/${d} ${h}:${mm}:${ss}`
}

const ignoreTheseNames = ['.DS_Store'] // files AND directories
function checkIgnore(f) {
  const IGNORE = '__ignore'
  const d = f.lastIndexOf('.')
  let n = f
  if(d > 0) { // name of '.DS_Store' is '.DS_Store'
    n = f.substring(0, d)
  }
  return n.slice(-1 * IGNORE.length) !== IGNORE && !ignoreTheseNames.includes(n)
}
function listFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true })
  const names = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name).filter(checkIgnore)
  return names
}
function listDirectories(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true })
  const names = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name).filter(checkIgnore)
  return names
}

function randAlphaNum(len = 4) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let str = ''
  for (var i = 0; i < len; i++) {
    str += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  return str
}

function genID(g) {
  return 'X-' + g + randAlphaNum(2) + '-' + randAlphaNum(4)
}

function idGenerator(num, g, map) {
  console.info('Generate new ids...')
  const used = Object.values(map).map(file => file.ioid)
  const generated = []
  for(let i = 0; i < num; i++) {
    const id = genID(g)
    while(used.includes(id) || generated.includes(id)) {
      id = genID(g)
    }
    generated.push(id)
  }
  return generated
}

async function getArchivistFileMap(archivist) {
  const doc = new GoogleSpreadsheet(process.env.DA_DOC_ID)
  doc.useApiKey(process.env.GOOGLE_SHEET_API_KEY)
  await doc.loadInfo()

  const rows = await doc.sheetsById[process.env.DA_SHEET_ID].getRows()
  map = Object.assign({}, ...rows.filter(row => row.ioid && row.archivist === archivist && row.archivist_p).map(row => ({
    [row.archivist_p]: {
      ioid: row.ioid,
      archivist: row.archivist,
      archivedAt: row.archivedAt,
      p: row.archivist_p
    }
  })))
  console.info(Object.keys(map).length, 'entries in map')
  return map
}

const extMap = { 'jpeg': 'jpg' }

function copyFiles(files, destDir) {
  for(const f of files) {
    const preferredExt = extMap[f.ext] ? extMap[f.ext] : f.ext
    const fileName = f.ioid + '.' + preferredExt
    console.info(fileName)
    const src = f.p
    const dest = path.resolve(destDir, fileName)
    fs.copyFileSync(src, dest, COPYFILE_EXCL)
    utimes(dest, {
      atime: f.atime.getTime(),
      mtime: f.mtime.getTime(),
      btime: f.btime.getTime()
    })
    // fs.fstatSync(fs.openSync(src))
    // fs.fstatSync(fs.openSync(dest))
    // a/m/b time should be identical except ctime
  }
}

/* fstat
macOS
- atime = ctime = Last opened
- mtime = Modified
- birthtime = Created
- 取代的話，全部都會改
- 修改內容看 mtime 好了
- 用最後修改時間當作 archivedAt
- 手動複製檔案 a/m/b time 維持不變 ctime 是複製當下的時間
*/

async function localImport(archivist) {
  const allowedFileExt = ['png', 'jpg', 'jpeg']

  console.info('Hi archivist', archivist)
  console.info('Get archivist file map...')
  const fileMap = await getArchivistFileMap(archivist)

  const root = process.env.LOCAL_ARCHIVE_ROOT_PATH
  const addFiles = []
  const updateFiles = []
  const volumes = ['0701']

  for(const volume of volumes) {
    const volumePath = path.resolve(root, volume)
    console.log(volumePath)
    const groups = listDirectories(volumePath)
    for(const group of groups) {
      const groupPath = path.resolve(root, volume, group)
      console.log(groupPath)
      const files = listFiles(groupPath).map(f => {
        const d = f.lastIndexOf('.')
        const n = f.substring(0, d)
        const ext = f.substring(d + 1)
        const p = path.resolve(root, volume, group, f)
        const fd = fs.openSync(p)
        const stat = fs.fstatSync(fd)
        const atime = stat.atime
        const mtime = stat.mtime
        const btime = stat.birthtime
        const archivedAt = datetime(stat.mtime)
        return { archivist, archivedAt, p, f, n, ext, atime, mtime, btime }
      })
      const uniqueFileNames = [...new Set(files.map(f => f.n))]
      for(const name of uniqueFileNames) {
        const matchFiles = files.filter(f => f.n === name)
        // console.log(matchFiles)
        let file = null
        for(const ext of allowedFileExt) {
          file = matchFiles.find(f => f.ext === ext)
          if(file) { break }
        }
        if(file) {
          // check if file in map
          const fileInMap = fileMap[file.p]
          if(fileInMap === undefined) {
            addFiles.push(file)
          } else { // file already in map (matching (local) path)
            const _old = new Date(fileInMap.archivedAt.trim().replace(/\s/g, ' ')) // gsheet uses nbsp (160) instead of space (32) 🤫
            const _new = new Date(file.mtime.getTime())
            _new.setMilliseconds(0) // discard ms
            if(_old < _new) {
              file.ioid = fileInMap.ioid
              updateFiles.push(file)
            }
          }
        }
      }
    }
    await wait(1)
  } // volume loop ends
  console.log(addFiles.length, 'files to add')
  console.log(updateFiles.length, 'files to update')
  await wait(1)

  // gen ids
  console.info('Generate IOID for files to add...')
  const ids = idGenerator(addFiles.length, 'P4', fileMap)
  console.log(ids)
  for(let i = 0; i < addFiles.length; i++) {
    addFiles[i].ioid = ids[i]
  }

  const tab = '\t'
  const keys = ['ioid', 'archivist', 'archivedAt', 'p', 'f', 'n', 'ext']
  fs.writeFileSync(path.resolve(__dirname, 'import-local-add.tsv'), addFiles.map(f => keys.map(k => f[k]).join(tab)).join('\n'))

  // TODO: list files to update
  fs.writeFileSync(path.resolve(__dirname, 'import-local-update.tsv'), JSON.stringify(updateFiles, null, '\t')) // FIXME: tmp

  // clear stage
  console.info('Clear stage...')
  const stageAdd = path.resolve(__dirname, '../stage-import-local-add')
  const stageUpdate = path.resolve(__dirname, '../stage-import-local-update')
  if(fs.existsSync(stageAdd)) {
    fs.rmdirSync(stageAdd, { recursive: true })
  }
  if(fs.existsSync(stageUpdate)) {
    fs.rmdirSync(stageUpdate, { recursive: true })
  }
  fs.mkdirSync(stageAdd)
  fs.mkdirSync(stageUpdate)

  // stage files to add
  console.info('Stage files to add...')
  copyFiles(addFiles, stageAdd)
  await wait(1)

  // stage files to update
  console.info('Stage files to update...')
  copyFiles(updateFiles, stageUpdate)
  await wait(1)

  console.log('Files staged')
}

const archivist = (process.env.ARCHIVIST ? process.env.ARCHIVIST : null)
if(archivist) {
  localImport(archivist)
} else {
  console.error('Archivist not found')
}
