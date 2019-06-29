const fs = require('fs')
const path = require('path')
const Conf = require('conf')

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

const CONFIG_FILE = 'lcpkg.config.json'

function resolve() {
  let workdir = process.cwd()

  do {
    const info = path.parse(workdir)
    const file = path.join(workdir, CONFIG_FILE)

    if (fs.existsSync(file)) {
      return file
    }
    if (info.dir === info.root) {
      break
    }
    workdir = info.dir
  } while (1)
  throw new Error(`${CONFIG_FILE} file is not found`)
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
