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

class Environment {
  constructor(file) {
    this.file = file
    this.projectDir = path.dirname(file)
    this.projectWorkDir = path.join(this.projectDir, 'lcpkg')
    this.projectPortsDir = path.join(this.projectWorkDir, 'ports')
    this.projectInstalledDir = path.join(this.projectWorkDir, 'installed')
    this.rootDir = path.join(homedir(), `.${name}`)
    this.packagesDir = path.join(this.rootDir, 'packages')
    this.downloadsDir = path.join(this.rootDir, 'downloads')
    mkdir(this.rootDir)
    mkdir(this.packagesDir)
    mkdir(this.downloadsDir)
    mkdir(this.projectWorkDir)
    mkdir(this.projectPortsDir)
    mkdir(this.projectInstalledDir)
  }
}

class LCPkg {
  constructor() {
    this.cfg = new Conf({ projectName: 'lcpkg', schema })
    this.env = null
    this.pkg = null
    this.arch = 'x86'
    this.platform = process.platform === 'win32' ? 'windows' : process.platform
  }

  get triplet() {
    return `${this.arch}-${this.platform}`
  }

  resolvePackage(pkg) {
    let contentDir = null
    let packageDir = null
    let triplet = this.triplet
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
    }
    return {
      ...pkg,
      triplet,
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

    this.env = new Environment(file)
    this.pkg = load(file)
  }

  save() {
    fs.writeFileSync(this.env.file, JSON.stringify(this.pkg, null, 2))
  }
}

const lcpkg = new LCPkg()

module.exports = lcpkg
