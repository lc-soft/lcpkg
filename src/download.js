const fs = require('fs-extra')
const path = require('path')
const filesize = require('filesize')
const request = require('request')
const progress = require('request-progress')
const decompress = require('decompress')
const _cliProgress = require('cli-progress')
const lcpkg = require('./index')

function download(url, filePath) {
  if (fs.existsSync(filePath)) {
    return
  }

  let started = false
  const bar = new _cliProgress.Bar({
    format: '[{bar}] {percentage}% | {value}/{total} | {speed}/s'
  }, _cliProgress.Presets.shades_classic)

  console.log(`downloading ${url}`)
  const tmpFilePath = `${filePath}.download`
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
        bar.update(bar.getTotal())
        bar.stop()
        fs.renameSync(tmpFilePath, filePath)
        resolve(filePath)
      })
      .pipe(fs.createWriteStream(tmpFilePath))
  })
}

function downloadBinaryPackage(pkg) {
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
  return download(url, filePath)
}

async function downloadBinaryPackages(packages) {
  const files = await Promise.all(packages.map(downloadBinaryPackage))
  return Promise.all(files.map((file, i) => {
    const packageDir = path.join(lcpkg.env.packagesDir, packages[i].name, packages[i].version)
    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir, { recursive: true })
    }
    if (fs.statSync(file).isDirectory()) {
      console.log(`copying ${file}`)
      return fs.copy(file, packageDir)
    }
    console.log(`extracting ${file}`)
    return decompress(file, packageDir)
  }))
}

async function downloadSourcePackage({ name, version, uri, sourcePath }) {
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
  return download(url, sourcePath)
}

async function downloadSourcePackages(packages) {
  return Promise.all(packages.map(downloadSourcePackage))
}

module.exports = {
  downloadBinaryPackages,
  downloadSourcePackages
}
