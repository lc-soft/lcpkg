const fs = require('fs')
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
    dirPath = path.resolve(lcpkg.env.downloadsdir, 'github.com', pkg.uri.substr(7).split('/')[0])
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

async function downloadPackages(packages) {
  const items = []

  for (let i = 0; i < packages.length; ++i) {
    items.push(await downloadPackage(packages[i]))
  }
  do {
    const item = items.shift()

    if (!item) {
      break
    }

    const destPath = path.resolve(lcpkg.env.packagesdir, item.info.name, item.info.version)

    if (fs.lstatSync(item.file).isDirectory()) {
      console.log(`copying ${path.basename(item.file)}`)
    } else {
      console.log(`extracting ${path.basename(item.file)}`)
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true })
      }
      await decompress(item.file, destPath)
    }
  } while (1)
}

module.exports = downloadPackages
