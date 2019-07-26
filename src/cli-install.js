const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const program = require('commander')
const { spawnSync } = require('child_process')
const download = require('./download')
const github = require('./github')
const local = require('./local')
const lcpkg = require('./index')

function getPackageTriplet(pkg) {
  if (lcpkg.platform === 'windows' && pkg.linkage === 'static') {
    return `${lcpkg.triplet}-static`
  }
  return lcpkg.triplet
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

function runVcpkgInstaller(packages) {
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
    ...packages.map((pkg) => `${pkg.name}:${pkg.triplet}`)
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
    let src
    const dest = path.resolve(lcpkg.env.installeddir, lcpkg.triplet)

    if (pkg.uri.startsWith('vcpkg:')) {
      src = path.resolve(vcpkgRoot, 'packages', `${pkg.name}_${pkg.triplet}`)
    } else {
      src = path.resolve(lcpkg.env.packagesdir, pkg.name, pkg.version, pkg.triplet)
    }
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    fs.readdirSync(path.join(src, 'lib')).some((item) => {
      const info = path.parse(item)

      if (['.a', '.lib'].includes(info.ext)) {
        libs.push(info.name)
        return true
      }
      return false
    })
    console.log(`${chalk.green('collect ')} ${src}`)
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

function printPackageUsage(libs) {
  console.log(chalk.green.bold(`\nPackages have been installed!\n`))
  console.log('If you are not using CMake, please try the following methods:')

  console.log(chalk.bold('\n1. Visual Studio\n'))
  printVisualStudioUsage(libs)

  console.log(chalk.bold('\n2. GCC Compiler\n'))
  printGccUsage(libs)

  console.log(chalk.bold('\n3. Others\n'))
  console.log('Refer to the methods above to configure your build tools.\n')
}

async function install(packages) {
  const vcpkgPackages = []
  const downloadPackages = []
  const installedPackages = packages.map((pkg) => {
    const info = Object.assign({}, pkg, { triplet: getPackageTriplet(pkg) })

    if (pkg.uri.startsWith('vcpkg:')) {
      vcpkgPackages.push(info)
    } else {
      downloadPackages.push(info)
    }
    return info
  })
  saveDependencies(packages)
  if (downloadPackages.length > 0) {
    await download(downloadPackages)
  }
  if (vcpkgPackages.length > 0) {
    runVcpkgInstaller(vcpkgPackages)
  }

  const libs = collectInstalledPackages(installedPackages)

  printPackageUsage(libs)
}

function loadDepenecies() {
  lcpkg.load()

  const deps = lcpkg.pkg.dependencies || []

  return Object.keys(deps).map(name => Object.assign({ name }, deps[name]))
}

async function resolvePackage(url, info) {
  if (github.validate(url)) {
    return await github.resolve(url, info)
  }
  if (local.validate(url)) {
    return await local.resolve(url, info)
  }
  return { name: url, version: 'latest', uri: `vcpkg:${url}` }
}

async function run(args) {
  const dict = {}
  const dependencies = loadDepenecies()
  const info = {
    linkage: program.staticLink ? 'static' : 'auto',
    platform: lcpkg.platform,
    arch: lcpkg.arch
  }
  let packages = []

  if (args.length < 1) {
    await install(dependencies)
    return
  }
  try {
    packages = await Promise.all(args.map(arg => resolvePackage(arg, info)))
  } catch (err) {
    console.error(err)
    return
  }
  await install(packages
    .filter((pkg) => {
      if (dict[pkg.name]) {
        return false
      }
      dict[pkg.name] = true
      return true
    })
    .map(pkg => Object.assign({}, pkg, {
      linkage: program.staticLink ? 'static' : 'auto'
    }))
    .concat(dependencies.filter(pkg => !dict[pkg.name])))
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
  .action(() => {
    lcpkg.setup(program)
    run(program.args.filter(arg => typeof arg === 'string'))
  })
  .parse(process.argv)
