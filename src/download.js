const fs = require('fs-extra')
const path = require('path')
const filesize = require('filesize')
const request = require('request')
const progress = require('request-progress')
const decompress = require('decompress')
const cliProgress = require('cli-progress')
const lcpkg = require('./index')

class Downloader {
  constructor() {
    this.files = []
    this.multibar = new cliProgress.MultiBar({
      fps: 1,
      format: '{filename} [{bar}] {value}/{total} | {speed}/s',
      clearOnComplete: true,
      hideCursor: true
    }, cliProgress.Presets.shades_classic)
  }

  getTaskName(filename) {
    const max = this.files.reduce((max, file) => Math.max(file.length, max), 0)
    return filename.padEnd(max, ' ')
  }

  download(url, filePath) {
    let bar = null
    const tmpFilePath = `${filePath}.download`
    const filename = filePath.substr(path.dirname(filePath).length + 1)

    if (fs.existsSync(filePath)) {
      return
    }
    this.files.push(filename)
    console.log(`downloading ${url}`)
    return new Promise((resolve, reject) => {
      progress(request(url))
        .on('progress', (state) => {
          if (!bar) {
            bar = this.multibar.create(state.size.total, state.size.transferred)
          }
          bar.update(state.size.transferred, {
            speed: filesize(state.speed || 0),
            filename: this.getTaskName(filename)
          })
        })
        .on('error', reject)
        .on('end', () => {
          bar.update(bar.getTotal())
          bar.stop()
          fs.renameSync(tmpFilePath, filePath)
          resolve(filePath)
        })
        .pipe(fs.createWriteStream(tmpFilePath))
    })
  }

  stop() {
    this.multibar.stop()
  }
}

function downloadBinaryPackage(downloader, pkg) {
  let url = null
  let dirPath = null
  let filePath = null
  let fileName = null

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
  return downloader.download(url, filePath)
}

async function downloadBinaryPackages(packages) {
  const downloader = new Downloader()
  const files = await Promise.all(packages.map((pkg) => downloadBinaryPackage(downloader, pkg)))
  const results = await Promise.all(files.map((file, i) => {
    const packageDir = path.join(lcpkg.env.packagesDir, packages[i].name, packages[i].version)
    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir, { recursive: true })
    }
    if (fs.statSync(file).isDirectory()) {
      return fs.copy(file, packageDir)
    }
    return decompress(file, packageDir)
  }))
  downloader.stop()
  return results
}

async function downloadSourcePackage(downloader, { name, version, uri, sourcePath }) {
  if (!uri.startsWith('github:')) {
    console.log(`${name} is not a package from GitHub, its source package download has been ignored`)
    return null
  }

  const repoPath = uri.substr(7)
  const dirPath = path.dirname(sourcePath)
  const url = `https://github.com/${repoPath}/archive/${version.startsWith('v') ? version : `v${version}`}.zip`

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  return downloader.download(url, sourcePath)
}

async function downloadSourcePackages(packages) {
  const downloader = new Downloader()
  const results = await Promise.all(packages.map((pkg) => downloadSourcePackage(downloader, pkg)))
  downloader.stop()
  return results
}

module.exports = {
  downloadBinaryPackages,
  downloadSourcePackages
}
