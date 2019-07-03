const fs = require('fs')
const path = require('path')
const program = require('commander')
const archiver = require('archiver')
const lcpkg = require('./index')

const devItems = ['include', 'lib', 'bin']

class PackEntry {
  constructor(name, data, env) {
    this.env = env
    this.name = name
    this.data = data
  }

  get input() {
    return this.replaceVaribales(path.resolve(path.join(lcpkg.env.rootdir, this.data.input)))
  }

  get triplet() {
    return `${this.env.arch}-${this.env.platform}`
  }

  get extensions() {
    if (this.data.extensions instanceof Array) {
      return this.data.extensions
    }
    if (this.name === 'lib') {
      if (process.platform === 'win32') {
        return ['.lib']
      }
      return ['.a']
    }
    if (this.name === 'bin') {
      if (process.platform === 'win32') {
        return ['.dll', '.pdb']
      }
      return ['.so']
    }
    if (this.name === 'include') {
      return ['.h']
    }
    return []
  }

  replaceVaribales(str) {
    return ['arch', 'platform', 'mode'].reduce((input, key) => {
      if (this.env[key]) {
        return input.replace(`\${${key}}`, this.env[key])
      }
      return input
    }, str)
  }

  testFile(file) {
    const info = path.parse(file)

    if (
      this.data.targets instanceof Array
      && !this.data.targets.includes(info.name)
    ) {
      return false
    }
    return this.extensions.includes(info.ext)
  }

  copyFiles(input, output) {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true })
    }
    fs.readdirSync(input).forEach((file) => {
      const srcPath = path.join(input, file)
      const destPath = path.join(output, file)
      const stat = fs.statSync(srcPath)

      if (this.data.recursive && stat.isDirectory()) {
        this.copyFiles(srcPath, destPath)
        return
      }
      if (this.testFile(srcPath)) {
        if (program.verbose) {
          console.log(`copy: ${path.relative(lcpkg.env.rootdir, srcPath)} -> ${destPath}`)
        }
        fs.copyFileSync(srcPath, destPath)
      }
    })
  }

  build() {
    let input = this.input
    let output = this.env.targetdir

    output = path.join(output, this.triplet)
    if (devItems.includes(this.name) && this.env.mode === 'debug') {
      if (this.name === 'include') {
        return
      }
      output = path.join(output, this.env.mode, this.name)
    } else {
      output = path.join(output, this.name)
    }
    this.copyFiles(input, output)
  }
}

class Packer {
  constructor() {
    lcpkg.load()
    this.target = `${lcpkg.pkg.name}-${lcpkg.pkg.version}`
    this.output = lcpkg.pkg.package.output || path.join(lcpkg.env.workdir, 'dist')
  }

  run() {
    const config = lcpkg.pkg.package
    const targetdir = path.join(this.output, this.target)

    if (!fs.existsSync(targetdir)) {
      fs.mkdirSync(targetdir, { recursive: true })
    }
    config.arch.forEach((arch) => {
      config.platform.forEach((platform) => {
        Object.keys(config.entry).forEach((name) => {
          config.mode.forEach((mode) => {
            new PackEntry(name, config.entry[name], { targetdir, arch, platform, mode }).build()
          })
        })
        this.pack(arch, platform)
      })
    })
  }

  pack(arch, platform) {
    const triplet = `${arch}-${platform}`
    const zipfile = path.join(this.output, `${this.target}_${triplet}.zip`)
    const output = fs.createWriteStream(zipfile)
    const archive = archiver('zip')

    console.log(`create: ${zipfile}`)
    archive.pipe(output)
    archive.file(lcpkg.env.file, { name: path.basename(lcpkg.env.file) })
    archive.directory(path.join(this.output, this.target, triplet), false)
    archive.finalize()
  }
}

program
  .usage('[options]')
  .option('-v, --verbose', 'enable verbose output', false)
  .action(() => {
    new Packer({ verbose: program.verbose }).run()
  })
  .parse(process.argv)
