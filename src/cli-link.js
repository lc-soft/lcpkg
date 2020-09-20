const path = require('path')
const fs = require('fs-extra')
const program = require('commander')
const lcpkg = require('./index')

function linkPackage() {
  const { name, version } = lcpkg.pkg
  const { packagesDir } = lcpkg.env
  const { packageOutputDir: outputDir } = lcpkg.project
  const pkgDir = path.resolve(packagesDir, name)
  const linkDir = path.join(pkgDir, version)
  const targetDir = path.resolve(outputDir, `${name}-${version}`)
  const backupDir = `${linkDir}.backup`

  if (!fs.existsSync(pkgDir)) {
    fs.mkdirSync(pkgDir)
  } else if (!fs.statSync(pkgDir).isDirectory()) {
    throw new Error(`file ${pkgDir} is not directory`)
  }
  if (fs.existsSync(linkDir)) {
    const stat = fs.lstatSync(linkDir)
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(linkDir)
    } else if (stat.isDirectory()) {
      fs.moveSync(linkDir, backupDir)
    } else {
      throw new Error(`file ${linkDir} is not directory`)
    }
  }
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  fs.symlinkSync(targetDir, linkDir)
  console.log(`${linkDir} -> ${targetDir}`)
}

program
  .action(() => {
    lcpkg.load()
    linkPackage()
  })
  .parse(process.argv)
