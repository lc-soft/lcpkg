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

function saveDependencies(packages) {
  const dependencies = {}

  packages.forEach((pkg) => {
    const dep = Object.assign({}, pkg)

    delete dep.name
    dependencies[pkg.name] = dep
  })
  lcpkg.pkg.dependencies = dependencies
  lcpkg.save()
}

function runVcpkgInstall(packages) {
  const vcpkgRoot = lcpkg.cfg.get('vcpkg.root')
  const file = path.join(vcpkgRoot, 'vcpkg')
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
}

function collectInstalledPackages(packages) {
  const libs = []
  const vcpkgRoot = lcpkg.cfg.get('vcpkg.root')

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
    console.log(`${chalk.green('Collect:')} ${src}`)
    fs.copySync(src, dest, { dereference: true })
  })
  return libs
}

function install(packages) {
  saveDependencies(packages)
  runVcpkgInstall(packages)

  const libs = collectInstalledPackages(packages)
  const lflags = libs.map(lib => `-l${lib}`).join(' ')
  const installeddir = path.relative(path.dirname(lcpkg.env.file), lcpkg.env.instaleddir)

  console.log('\nPackages have been installed, if you are not using CMake, you can use these packages in the following ways:\n')

  console.log(chalk.bold('1. Configure project properties in the Visual Studio:\n'))
  console.log(`C/C++ -> Additional Include Directoreis: ${path.join(installeddir, 'include')}`)
  console.log(`Linker -> General -> Additinal Library Directories: ${path.join(installeddir, 'lib')}`)
  console.log(`Linker -> Input -> Additinal Dependencies: ${libs.join(';')};`)

  console.log(chalk.bold('\n2. Using gcc to compile:\n'))
  console.log(`gcc -I ${path.join(installeddir, 'include')} -c example.c`)
  console.log(`gcc -L ${path.join(installeddir, 'lib')} ${lflags} -o example example.o`)

  console.log(chalk.bold('\n3. Refer to the methods above to configure your build tools'))
}

function run() {
  let packages = program.args

  lcpkg.load()
  if (packages.length < 1) {
    packages = lcpkg.pkg.dependencies || []
    packages = Object.keys(packages).map(name => Object.assign({ name }, packages[name]))
  } else {
    packages = packages.map((name) => Object.assign({
      name,
      linkage: program.staticLink ? 'static' : 'auto'
    }))
  }
  install(packages)
}

program
  .usage('[options] <pkg...>')
  .option('--static-link', 'link to static library')
  .parse(process.argv)

run()
