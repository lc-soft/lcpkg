const fs = require('fs-extra')
const path = require('path')
const program = require('commander')
const archiver = require('archiver')
const lcpkg = require('./index')
const config = require('./config')

const devItems = ['include', 'lib', 'bin']

class PackEntry {
  constructor(name, data, env) {
    this.env = env
    this.name = name
    this.data = typeof data  === 'string' ? { input: data } : data
    if (name === 'include' || name === 'content') {
      if (typeof this.data.recursive === 'undefined') {
        this.data.recursive = true
      }
    }
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
    if (this.extensions.length < 1) {
      return true
    }
    return this.extensions.includes(info.ext)
  }

  copyFiles(input, output) {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true })
    }
    if (!fs.existsSync(input)) {
      return
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
          console.log(`copy ${path.relative(lcpkg.env.rootdir, srcPath)} -> ${destPath}`)
        }
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

  async run() {
    const tasks = []
    const info = lcpkg.pkg
    const targetdir = path.join(this.output, this.target)

    if (fs.existsSync(targetdir)) {
      console.log('remove old files')
      fs.removeSync(targetdir)
    }
    fs.mkdirSync(targetdir, { recursive: true })
    if (info.package.entry.content) {
      new PackEntry('content', info.package.entry.content, { targetdir }).build()
    }
    info.arch.forEach((arch) => {
      info.platform.forEach((platform) => {
        Object.keys(info.package.entry).forEach((name) => {
          if (name === 'content') {
            return
          }
          info.mode.forEach((mode) => {
            new PackEntry(name, info.package.entry[name], { targetdir, arch, platform, mode }).build()
          })
        })
        tasks.push(this.pack.bind(this, arch, platform))
      })
    })
    tasks.push(this.packAll.bind(this))
    do {
      const task = tasks.shift()

      if (!task) {
        break
      }
      await task()
    } while (1)
  }

  pack(arch, platform) {
    const archive = archiver('zip')
    const triplet = `${arch}-${platform}`
    const zipfile = path.join(this.output, `${this.target}_${triplet}${config.packageFileExt}`)
    const output = fs.createWriteStream(zipfile)
    const contentPath = path.join(this.output, this.target, 'content')

    return new Promise((resolve, reject) => {
      console.log(`create: ${zipfile}`)
      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)
      archive.file(lcpkg.env.file, { name: path.basename(lcpkg.env.file) })
      archive.directory(path.join(this.output, this.target, triplet), triplet)
      if (fs.existsSync(contentPath)) {
        archive.directory(contentPath, 'content')
      }
      archive.finalize()
    })
  }

  packAll() {
    const archive = archiver('zip')
    const zipfile = path.join(this.output, `${this.target}_all${config.packageFileExt}`)
    const output = fs.createWriteStream(zipfile)

    return new Promise((resolve, reject) => {
      console.log(`create: ${zipfile}`)
      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)
      archive.file(lcpkg.env.file, { name: path.basename(lcpkg.env.file) })
      archive.directory(path.join(this.output, this.target), false)
      archive.finalize()
    })
  }
}

program
  .usage('[options]')
  .option('-v, --verbose', 'enable verbose output', false)
  .action(() => {
    new Packer({ verbose: program.verbose }).run()
  })
  .parse(process.argv)
