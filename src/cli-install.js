const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const program = require('commander')
const { spawnSync } = require('child_process')
const lcpkg = require('./index')

function getTriplet() {
  const triplet = [program.arch]

  if (process.platform === 'win32') {
    triplet.push('windows')
  } else {
    triplet.push(process.platform)
  }
  return triplet.join('-')
}

function getPackageTriplet(pkg) {
  const triplet = [program.arch]

  if (process.platform === 'win32') {
    triplet.push('windows')
    if (pkg.linkage === 'static') {
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

  if (!vcpkgRoot) {
    console.log('Please using the following command to configure the path of vcpkg root directory:\n')
    console.log('\tlcpkg config vcpkg.root path/to/vcpkg\n')
    throw new Error('vcpkg root directory was not found')
  }

  const file = path.join(vcpkgRoot, 'vcpkg')
  const params = [
    `--overlay-ports=${lcpkg.env.portsdir}`,
    '--vcpkg-root',
    vcpkgRoot,
    'install',
    ...packages.map((pkg) => `${pkg.name}:${getPackageTriplet(pkg)}`)
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
    const triplet = getPackageTriplet(pkg)
    const dest = path.resolve(lcpkg.env.installeddir, getTriplet())
    const src = path.resolve(vcpkgRoot, 'packages', `${pkg.name}_${triplet}`)

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    fs.readdirSync(path.join(src, 'lib')).some((item) => {
      const info = path.parse(item)

      if (['.a', '.lib'].indexOf(info.ext) >= 0) {
        libs.push(info.name)
        return true
      }
      return false
    })
    console.log(`${chalk.green('Collect:')} ${src}`)
    fs.copySync(src, dest, { dereference: true })
  })
  return libs
}

function printVisualStudioUsage(libs) {
  const instdir = path.relative(path.dirname(lcpkg.env.file), path.join(lcpkg.env.installeddir, '$(PlatformTarget)-windows'))

  console.log('Edit project properties and find the following configuration items:\n')
  console.log(`    ${chalk.bold('C/C++ -> Additional Include Directories:')} ${path.join(instdir, 'include')}`)
  console.log(`    ${chalk.bold('Linker -> General -> Additinal Library Directories:')} ${path.join(instdir, 'lib')}`)
  console.log(`    ${chalk.bold('Linker -> Input -> Additinal Dependencies:')} ${libs.join(';')};`)
}

function printGccUsage(libs) {
  const lflags = libs.map(lib => `-l${lib.startsWith('lib') ? lib.substr(3) : lib}`).join(' ')
  const instdir = path.relative(path.dirname(lcpkg.env.file), path.join(lcpkg.env.installeddir, `${program.arch}-linux`))

  console.log('Add cflags and ldflags to compile:\n')
  console.log(`    gcc -I ${path.join(instdir, 'include')} -c example.c`)
  console.log(`    gcc -L ${path.join(instdir, 'lib')} ${lflags} -o example example.o`)
}

function install(packages) {
  saveDependencies(packages)
  runVcpkgInstall(packages)

  const libs = collectInstalledPackages(packages)

  console.log(chalk.green.bold(`\nPackages have been installed!\n`))
  console.log('If you are not using CMake, please try the following methods:')

  console.log(chalk.bold('\n1. Visual Studio\n'))
  printVisualStudioUsage(libs)

  console.log(chalk.bold('\n2. GCC Compiler\n'))
  printGccUsage(libs)

  console.log(chalk.bold('\n3. Others\n'))
  console.log('Refer to the methods above to configure your build tools.\n')
}

function loadDepenecies() {
  lcpkg.load()

  const deps = lcpkg.pkg.dependencies || []

  return Object.keys(deps).map(name => Object.assign({ name }, deps[name]))
}

function run() {

  const dependencies = loadDepenecies()
  let packages = dependencies

  if (program.args.length > 0) {
    packages = program.args.map((name) => Object.assign({
      name,
      linkage: program.staticLink ? 'static' : 'auto'
    })).concat(dependencies)
  }
  install(packages)
}

program
  .usage('[options] <pkg...>')
  .option('--static-link', 'link to static library')
  .option('--arch <arch>', 'specify which CPU architecture package to use', (arch, defaultArch) => {
    if (['x86', 'x64', 'arm'].indexOf(arch) < 0) {
      console.error(`invalid arch: ${arch}`)
      return defaultArch
    }
    return arch
  }, 'x86')
  .parse(process.argv)

run()
