const fs = require('fs')
const path = require('path')
const decompress = require('decompress')
const lcpkg = require('./index')
const config = require('./config')

function validate(url) {
  return !!path.parse(url).dir
}

async function resolve(url, info) {
  const fullPath = path.resolve(url)
  const destPath = path.join(lcpkg.env.downloadsdir, path.parse(url).name)
  const configFile = path.join(destPath, config.configFileName)

  await decompress(url, destPath, { filter: file => file.path === config.configFileName })

  if (!fs.existsSync(configFile)) {
    throw new Error(`${url}: unable to read package information`)
  }

  const pkgConfig = require(configFile)

  if (!pkgConfig.platform.includes(info.platform)) {
    throw new Error(`${pkgConfig.name} does not support ${info.platform} platform`)
  }
  if (!pkgConfig.arch.includes(info.arch)) {
    throw new Error(`${pkgConfig.name} does not support ${info.arch} CPU architecture`)
  }
  return {
    name: pkgConfig.name,
    version: pkgConfig.version,
    uri: `file:${fullPath}`,
    resolved: { all: fullPath }
  }
}

module.exports = {
  validate,
  resolve
}
