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

  replaceVaribales(str) {
    return ['arch', 'platform', 'mode'].reduce((input, key) => {
      return input.replace(`\${${key}}`, this.env[key])
    }, str)
  }

  testFile(file) {
    let extensions = []
    const ext = path.extname(file)

    if (this.name === 'lib') {
      if (process.platform === 'win32') {
        extensions = ['.lib']
      } else {
        extensions = ['.a']
      }
    } else if (this.name === 'bin') {
      if (process.platform === 'win32') {
        extensions = ['.dll', '.pdb']
      } else {
        extensions = ['.so']
      }
    } else if (this.name === 'include') {
      extensions = ['.h']
    }
    if (this.data.extensions instanceof Array) {
      extensions = this.data.extensions
    }
    return extensions.includes(ext)
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
        console.log(`Create: ${destPath}`)
        fs.copyFileSync(srcPath, destPath)
      }
    })
  }

  build() {
    let input = this.input
    let output = this.env.targetdir

    if (devItems.includes(this.name)) {
      output = path.join(output, this.triplet)
      if (this.env.mode === 'debug') {
        if (this.name === 'include') {
          return
        }
        output = path.join(output, this.env.mode, this.name)
      } else {
        output = path.join(output, this.name)
      }
    } else {
      output = path.join(output, 'data')
    }
    this.copyFiles(input, output)
  }
}

class Packer {
  constructor() {
    lcpkg.load()
    this.target = `${lcpkg.pkg.name}-${lcpkg.pkg.version}`
    this.output = lcpkg.pkg.package.output || path.join(lcpkg.env.workdir, 'dist')
    this.zipfile = path.join(this.output, `${this.target}.zip`)
  }

  run() {
    const config = lcpkg.pkg.package
    const targetdir = path.join(this.output, this.target)

    console.log(`build package: ${this.zipfile}`)
    if (!fs.existsSync(targetdir)) {
      fs.mkdirSync(targetdir, { recursive: true })
    }
    Object.keys(config.entry).forEach((name) => {
      const entry = config.entry[name]

      if (!devItems.includes(name)) {
        new PackEntry(name, entry, { targetdir, arch, platform, mode }).build()
        return
      }
      config.platform.forEach((platform) => {
        config.arch.forEach((arch) => {
          config.mode.forEach((mode) => {
            new PackEntry(name, entry, { targetdir, arch, platform, mode }).build()
          })
        })
      })
    })
    this.pack()
  }

  pack() {
    const output = fs.createWriteStream(this.zipfile)
    const archive = archiver('zip')

    console.log(`create: ${this.zipfile}`)
    archive.pipe(output)
    archive.file(lcpkg.env.file, { name: path.basename(lcpkg.env.file) })
    archive.directory(path.join(this.output, this.target), false)
    archive.finalize()
  }
}

console.log('aaa')
program
  .usage('create a zipball from a package')
  .action(() => {
    console.log('pack')
    new Packer().run()
  })
  .parse(process.argv)
