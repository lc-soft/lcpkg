const fs = require('fs')
const path = require('path')

const CONFIG_FILE = 'vcpkg.config.js'

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

function load() {
  const file = resolve()
  const ext = path.parse(file).ext

  if (ext === '.json') {
    return JSON.parse(fs.readFileSync(file))
  } if (ext === '.js') {
    return require(file)
  }
  throw new Error(`${file}: invalid format`)
}

class Env {
  constructor(file) {
    this.file = file
    this.rootdir = path.dirname(file)
    this.workdir = path.join(this.rootdir, 'lcpkg')
    this.portsdir = path.join(this.workdir, 'ports')
    this.instaleddir = path.join(this.workdir, 'installed')
  }
}

class Config {
  constructor() {
    this.env = new Env(resolve())
    this.data = load()
  }
}

module.exports = Config
