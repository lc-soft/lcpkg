const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const program = require('commander')
const { spawnSync } = require('child_process')
const { renderString } = require('template-file')
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
  const result = spawnSync(file, params, { stdio: 'inherit' })
  console.log(chalk.blue('==== vcpkg call end ====\n'))
  return result.status
}

function collectInstalledPackages(packages) {
  const libs = []
  const vcpkgRoot = lcpkg.cfg.get('vcpkg.root')
  const dest = path.join(lcpkg.env.installeddir, lcpkg.triplet)
  const contentDest = path.join(lcpkg.env.installeddir, 'content')

  if (!fs.existsSync(contentDest)) {
    fs.mkdirSync(contentDest)
  }
  packages.forEach((pkg) => {
    let src
    let contentSrc = null

    if (pkg.uri.startsWith('vcpkg:')) {
      src = path.resolve(vcpkgRoot, 'packages', `${pkg.name}_${pkg.triplet}`)
    } else {
      const pkgDir = path.resolve(lcpkg.env.packagesdir, pkg.name, pkg.version)

      src = path.join(pkgDir, pkg.triplet)
      contentSrc = path.join(pkgDir, 'content')
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
    console.log(`${chalk.green('collect')} ${src}`)
    fs.copySync(src, dest, { dereference: true })
    if (contentSrc && fs.existsSync(contentSrc)) {
      fs.copySync(contentSrc, contentDest, { dereference: true })
      console.log(`${chalk.green('collect')} ${contentSrc}`)
    }
  })
  console.log(`${chalk.green('collect')} ${contentDest}`)
  fs.copySync(contentDest, lcpkg.env.rootdir, { dereference: true })
  return libs
}

function writePackageUsage(libs) {
  const infile = path.join(__dirname, 'USAGE.md')
  const outfile = path.join(lcpkg.env.workdir, 'USAGE.md')
  const instdir = path.relative(lcpkg.env.rootdir, lcpkg.env.installeddir)
  const linuxInstdir = path.join(instdir, `${program.arch}-linux`)
  const winInstdir = path.join(instdir, '$(PlatformTarget)-windows')
  const ldflags = libs.map(lib => `-l${lib.startsWith('lib') ? lib.substr(3) : lib}`).join(' ')
  const usage = {
    vs: {
      includedir: path.join(winInstdir, 'include'),
      libdir: path.join(winInstdir, 'lib'),
      libs: libs.join(';')
    },
    gcc: {
      cflags: `-I ${path.join(linuxInstdir, 'include')}`,
      ldflags: `-L ${path.join(linuxInstdir, 'lib')} ${ldflags}`
    }
  }
  fs.writeFileSync(outfile, renderString(fs.readFileSync(infile, { encoding: 'utf-8' }), usage))
  return outfile
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
  if (vcpkgPackages.length > 0) {
    if (runVcpkgInstaller(vcpkgPackages) !== 0) {
      console.error('vcpkg is not working correctly, installation has been terminated.')
      return
    }
  }
  if (downloadPackages.length > 0) {
    await download(downloadPackages)
  }
  saveDependencies(packages)

  const libs = collectInstalledPackages(installedPackages)
  const file = writePackageUsage(libs)

  console.log(chalk.green('\npackages are installed!\n'))
  console.log(`to find out how to use them, please see: ${file}`)
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
  }, process.platform === 'win32' ? 'x86' : 'x64')
  .action(() => {
    lcpkg.setup(program)
    run(program.args.filter(arg => typeof arg === 'string'))
  })
  .parse(process.argv)
