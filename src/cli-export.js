const fs = require('fs-extra')
const path = require('path')
const program = require('commander')
const lcpkg = require('./index')
const { addArchOption, addPlatformOption, addModeOption } = require('./utils')

function exportRuntimeFiles(destDir) {
  lcpkg.loadPackages().forEach((pkg) => {
    const binDir = program.mode === 'debug' ?
      path.join(pkg.packageDir, 'debug', 'bin') :
      path.join(pkg.packageDir, 'bin')

    console.log(`exporting ${pkg.name}:${pkg.triplet}-${program.mode}`)
    if (fs.existsSync(binDir) && fs.statSync(binDir).isDirectory()) {
      fs.readdirSync(binDir).some((name) => {
        if (!['.dll', '.so', '.pdb'].includes(path.parse(name).ext)) {
          return
        }
        fs.copyFileSync(path.join(binDir, name), path.join(destDir, name))
      })
    }
    if (!pkg.contentDir || !fs.existsSync(pkg.contentDir)) {
      return
    }
    fs.copySync(pkg.contentDir, destDir, { dereference: true })
  })
}

function exportBuildFiles(destDir) {
  const destLibDir = path.join(destDir, 'lib')
  const destIncDir = path.join(destDir, 'include')

  if (!fs.existsSync(destLibDir)) {
    fs.mkdirSync(destLibDir)
  }
  if (!fs.existsSync(destIncDir)) {
    fs.mkdirSync(destIncDir)
  }
  lcpkg.loadPackages().forEach((pkg) => {
    const libDir = program.mode === 'debug' ?
      path.join(pkg.packageDir, 'debug', 'lib') :
      path.join(pkg.packageDir, 'lib')
    const incDir = path.join(pkg.packageDir, 'include')

    console.log(`exporting ${pkg.name}:${pkg.triplet}-${program.mode}`)
    fs.copySync(libDir, destLibDir)
    fs.copySync(incDir, destIncDir)
  })
}

function exportFiles(destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  if (program.filter === 'runtime') {
    exportRuntimeFiles(destDir)
  } else if (program.filter === 'build') {
    exportBuildFiles(destDir)
  }
}

program.option('--filter <name>', 'specify how to filter files', (name, defaultName) => {
  if (['none', 'runtime', 'build'].indexOf(name) < 0) {
    console.error(`invalid arch: ${name}`)
    return defaultName
  }
  return name
}, 'none')

addArchOption(program)
addPlatformOption(program)
addModeOption(program)

program
  .arguments('<directory>')
  .action((arg) => {
    lcpkg.setup(program)
    lcpkg.load()
    exportFiles(path.resolve(lcpkg.project.baseDir, arg))
  })
  .parse(process.argv)
