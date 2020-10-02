const fs = require('fs')
const path = require('path')
const Conf = require('conf')
const config = require('./config')
const { homedir } = require('os')
const { name } = require('../package.json')

const schema = {
	vcpkg: {
    type: 'object',
    properties: {
      root: {
        type: 'string'
      }
    }
	}
}

function resolve() {
  let workDir = process.cwd()

  do {
    const info = path.parse(workDir)
    const file = path.join(workDir, config.configFileName)

    if (fs.existsSync(file)) {
      return file
    }
    if (info.dir === info.root) {
      break
    }
    workDir = info.dir
  } while (1)
  throw new Error(`${config.configFileName} file is not found`)
}

function load(file) {
  const ext = path.parse(file).ext

  if (ext === '.json') {
    return JSON.parse(fs.readFileSync(file))
  } if (ext === '.js') {
    return require(file)
  }
  throw new Error(`${file}: invalid format`)
}

function mkdir(dirpath) {
  if (fs.existsSync(dirpath)) {
    return false
  }
  fs.mkdirSync(dirpath)
  return true
}

class LCpkgEnvironment {
  constructor() {
    this.rootDir = path.join(homedir(), `.${name}`)
    this.packagesDir = path.join(this.rootDir, 'packages')
    this.downloadsDir = path.join(this.rootDir, 'downloads')
    mkdir(this.rootDir)
    mkdir(this.packagesDir)
    mkdir(this.downloadsDir)
  }
}

class LCpkgProjectEnvironment {
  constructor(file) {
    this.file = file
    this.baseDir = path.dirname(file)
    this.workDir = path.join(this.baseDir, 'lcpkg')
    this.portsDir = path.join(this.workDir, 'ports')
    this.installedDir = path.join(this.workDir, 'installed')
    this.packageOutputDir = path.join(this.workDir, 'dist')
    mkdir(this.workDir)
    mkdir(this.portsDir)
    mkdir(this.installedDir)
    mkdir(this.packageOutputDir)
  }
}

class LCPkg {
  constructor() {
    this.cfg = new Conf({ projectName: 'lcpkg', schema })
    this.env = new LCpkgEnvironment()
    this.project = null
    this.pkg = { name: 'unknown', version: 'unknown' }
    this.arch = 'x86'
    this.platform = process.platform === 'win32' ? 'windows' : process.platform
  }

  get triplet() {
    return `${this.arch}-${this.platform}`
  }

  resolvePackage(pkg) {
    let contentDir = null
    let packageDir = null
    let sourcePath = null
    let { triplet } = this
    const vcpkgRoot = this.cfg.get('vcpkg.root')

    if (this.platform === 'windows' && pkg.linkage === 'static') {
      triplet += '-static'
    }
    if (pkg.uri.startsWith('vcpkg:')) {
      packageDir = path.resolve(vcpkgRoot, 'packages', `${pkg.name}_${triplet}`)
    } else {
      packageDir = path.resolve(this.env.packagesDir, pkg.name, pkg.version)
      contentDir = path.join(packageDir, 'content')
      packageDir = path.resolve(packageDir, triplet)
      if (pkg.uri.startsWith('github:')) {
        sourcePath = path.resolve(
          lcpkg.env.downloadsDir,
          'github.com',
          pkg.uri.substr(7).split('/')[0],
          `${pkg.name}-${pkg.version}_source.zip`
        )
      }
    }
    return {
      ...pkg,
      triplet,
      sourcePath,
      packageDir,
      contentDir
    }
  }

  loadPackages() {
    const deps = this.pkg.dependencies || []
    return Object.keys(deps).map((name) => this.resolvePackage({ name, ...deps[name] }))
  }

  setup(program) {
    this.arch = program.arch
    if (program.platform) {
      this.platform = program.platform
    }
  }

  load() {
    const file = resolve()
    this.project = new LCpkgProjectEnvironment(file)
    this.pkg = load(file)
    if (this.pkg.package && this.pkg.package.output) {
      this.env.packageOutputDir = this.pkg.package.output
    }
  }

  save() {
    fs.writeFileSync(this.project.file, JSON.stringify(this.pkg, null, 2))
  }
}

const lcpkg = new LCPkg()

module.exports = lcpkg
