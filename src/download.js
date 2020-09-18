const fs = require('fs-extra')
const path = require('path')
const filesize = require('filesize')
const request = require('request')
const progress = require('request-progress')
const decompress = require('decompress')
const _cliProgress = require('cli-progress')
const lcpkg = require('./index')

async function downloadPackage(pkg) {
  let url = null
  let dirPath = null
  let filePath = null
  let fileName = null
  let tmpFilePath = null

  if (pkg.uri.startsWith('github:')) {
    url = pkg.resolved[lcpkg.triplet]
    if (url) {
      fileName = `${pkg.name}-${pkg.version}_${pkg.triplet}${path.extname(url)}`
    } else {
      url = pkg.resolved.all
      fileName = `${pkg.name}-${pkg.version}_all${path.extname(url)}`
      if (!url) {
        throw new Error(`unable to resolve package download URL for ${pkg.name}`)
      }
    }
    dirPath = path.resolve(lcpkg.env.downloadsDir, 'github.com', pkg.uri.substr(7).split('/')[0])
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    filePath = path.join(dirPath, fileName)
  } else if (pkg.uri.startsWith('file:')) {
    filePath = pkg.resolved.all
    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath}: file does not exist`)
    }
  } else if (pkg.uri.startsWith('npm:')) {
    filePath = pkg.resolved[pkg.triplet]
    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath}: file does not exist`)
    }
  } else {
    throw new Error(`invalid URI: ${pkg.uri}`)
  }
  if (fs.existsSync(filePath)) {
    return { file: filePath, info: pkg }
  }

  let started = false
  const bar = new _cliProgress.Bar({
    format: '[{bar}] {percentage}% | {value}/{total} | {speed}/s'
  }, _cliProgress.Presets.shades_classic)

  console.log(`downloading ${url}`)
  tmpFilePath = `${filePath}.download`
  return new Promise((resolve, reject) => {
    progress(request(url))
      .on('progress', (state) => {
        if (!started) {
          bar.start(state.size.total, state.size.transferred)
          started = true
        }
        bar.update(state.size.transferred, {
          speed: filesize(state.speed || 0)
        })
      })
      .on('error', reject)
      .on('end', () => {
        bar.stop()
        fs.renameSync(tmpFilePath, filePath)
        resolve({ file: filePath, info: pkg })
      })
      .pipe(fs.createWriteStream(tmpFilePath))
  })
}

async function download(packages) {
  const items = await Promise.all(packages.map(downloadPackage))
  return Promise.all(items.map((item) => {
    const packageDir = path.join(lcpkg.env.packagesDir, item.info.name, item.info.version)
    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir, { recursive: true })
    }
    if (fs.statSync(item.file).isDirectory()) {
      console.log(`copying ${item.file}`)
      return fs.copy(item.file, packageDir)
    }
    console.log(`extracting ${item.file}`)
    return decompress(item.file, packageDir)
  }))
}

module.exports = download
