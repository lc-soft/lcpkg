const path = require('path')
const program = require('commander')
const { spawnSync } = require('child_process')
const Config = require('./config')

const config = new Config()
const vcpkgRootPath = 'C:\\Users\\LC\\Documents\\GitHub\\vcpkg'

function getTriplet(pkg) {
  const triplet = ['x64']

  if (process.platform === 'win32') {
    triplet.push('windows')
  }
  if (pkg.target === 'static') {
    triplet.push('static')
  }
  return triplet.join('-')
}

function install(packages) {
  const file = path.join(vcpkgRootPath, 'vcpkg')
  const params = [
    `--overlay-ports=${config.env.portsdir}`,
    '--vcpkg-root',
    vcpkgRootPath,
    'install',
    ...packages.map((pkg) => `${pkg.name}:${getTriplet(pkg)}`)
  ]

  console.log(file, ...params)
  spawnSync(file, params, { stdio: 'inherit' })
}

function run() {
  let packages = program.args

  if (packages.length < 1) {
    packages = config.data.dependencies
    packages = Object.keys(packages).map(name => Object.assign({ name }, packages[name]))
  } else {
    packages = packages.map((name) => Object.assign({
      name,
      target: program.staticLink ? 'static' : 'auto'
    }))
  }
  install(packages)
}

program
  .usage('[options] <pkg...>')
  .option('--static-link', 'link to static library')
  .parse(process.argv)

run()
