const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const program = require('commander')
const { spawnSync } = require('child_process')
const lcpkg = require('./index')

function getTriplet(pkg) {
  const triplet = ['x64']

  if (process.platform === 'win32') {
    triplet.push('windows')
    if (pkg.target === 'static') {
      triplet.push('static')
    }
  } else {
    triplet.push(process.platform)
  }
  return triplet.join('-')
}

function install(packages) {
  const vcpkgRoot = lcpkg.cfg.get('vcpkg.root')
  const installeddir = path.relative(path.dirname(lcpkg.env.file), lcpkg.env.instaleddir)
  const file = path.join(vcpkgRoot, 'vcpkg')
  const libs = []
  const params = [
    `--overlay-ports=${lcpkg.env.portsdir}`,
    '--vcpkg-root',
    vcpkgRoot,
    'install',
    ...packages.map((pkg) => `${pkg.name}:${getTriplet(pkg)}`)
  ]

  console.log(chalk.blue('==== vcpkg call begin ===='))
  console.log(file, ...params, '\n')
  spawnSync(file, params, { stdio: 'inherit' })
  console.log(chalk.blue('==== vcpkg call end ====\n'))
  packages.forEach((pkg) => {
    const triplet = getTriplet(pkg)
    const dest = path.resolve(lcpkg.env.instaleddir, triplet)
    const src = path.resolve(vcpkgRoot, 'packages', `${pkg.name}_${triplet}`)

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    fs.readdirSync(path.join(src, 'lib')).some((item) => {
      const info = path.parse(item)

      if (['.a', 'lib'].indexOf(info.ext) >= 0) {
        if (info.name.startsWith('lib')) {
          libs.push(info.name.substr(3))
        } else {
          libs.push(info.name)
        }
        return true
      }
      return false
    })
    console.log(`${chalk.green('collect:')} ${src}`)
    fs.copySync(src, dest, { dereference: true })
  })

  const lflags = libs.map(lib => `-l${lib}`).join(' ')

  console.log('\nusage:\n')
  console.log(`gcc -I ${path.join(installeddir, 'include')} -c example.c`)
  console.log(`gcc -L ${path.join(installeddir, 'lib')} ${lflags} -o example example.o`)
}

function run() {
  let packages = program.args

  lcpkg.load()
  if (packages.length < 1) {
    packages = lcpkg.pkg.dependencies
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
