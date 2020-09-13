const fs = require('fs')
const path = require('path')
const Conf = require('conf')
const config = require('./config')

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
  let workdir = process.cwd()

  do {
    const info = path.parse(workdir)
    const file = path.join(workdir, config.configFileName)

    if (fs.existsSync(file)) {
      return file
    }
    if (info.dir === info.root) {
      break
    }
    workdir = info.dir
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
    this.rootdir = path.dirname(file)
    this.workdir = path.join(this.rootdir, 'lcpkg')
    this.portsdir = path.join(this.workdir, 'ports')
    this.packagesdir = path.join(this.workdir, 'packages')
    this.downloadsdir = path.join(this.workdir, 'downloads')
    this.installeddir = path.join(this.workdir, 'installed')
    mkdir(this.workdir)
    mkdir(this.portsdir)
    mkdir(this.installeddir)
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
      packageDir = path.resolve(this.env.packagesdir, pkg.name, pkg.version)
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
