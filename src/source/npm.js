const fs = require('fs')
const path = require('path')
const lcpkg = require('../index')
const config = require('../config')

function validate(url) {
  return url.startsWith('npm:')
}

async function resolve(url, { platform, arch }) {
  const name = url.substr(4)
  const npmPkgPath = path.join(lcpkg.project.baseDir, 'node_modules', name)
  const resolved = {}

  if (!fs.existsSync(npmPkgPath)) {
    throw new Error(`cannot resolve npm package: ${name}`)
  }

  const configFile = path.join(npmPkgPath, config.configFileName)

  if (!fs.existsSync(configFile)) {
    throw new Error(`unable to read package information: ${url}`)
  }

  const pkgConfig = require(configFile)
  let outputPath = 'lcpkg/dist'

  if (pkgConfig.package && pkgConfig.package.output) {
    outputPath = pkgConfig.package.output
  }

  const lcpkgOutputPath = path.join(npmPkgPath, outputPath)

  if (!fs.existsSync(lcpkgOutputPath)) {
    throw new Error(`cannot resolve the lcpkg output directory: ${url}`)
  }
  if (!pkgConfig.platform.includes(platform)) {
    throw new Error(`${pkgConfig.name} does not support ${platform} platform`)
  }
  if (!pkgConfig.arch.includes(arch)) {
    throw new Error(`${pkgConfig.name} does not support ${arch} CPU architecture`)
  }
  pkgConfig.arch.forEach((arch) => {
    pkgConfig.platform.forEach((platform) => {
      const key = `${arch}-${platform}`

      resolved[key] = path.join(url, outputPath, key)
    })
  })
  return {
    name: pkgConfig.name,
    version: pkgConfig.version,
    uri: url,
    resolved
  }
}

module.exports = {
  validate,
  resolve
}
