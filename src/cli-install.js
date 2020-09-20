const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const program = require('commander')
const { format } = require('util')
const { spawnSync } = require('child_process')
const { renderString } = require('template-file')
const download = require('./download')
const source = require('./source')
const lcpkg = require('./index')
const { addPlatformOption, addArchOption } = require('./utils')

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
    `--overlay-ports=${lcpkg.project.portsDir}`,
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
  const dest = path.join(lcpkg.project.installedDir, lcpkg.triplet)
  const contentDestDir = path.join(lcpkg.project.installedDir, 'content')

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest)
  }
  if (!fs.existsSync(contentDestDir)) {
    fs.mkdirSync(contentDestDir)
  }
  packages
    .forEach((pkg) => {
      const { packageDir, contentDir } = pkg
      const libDir = path.join(packageDir, 'lib')
      if (fs.existsSync(libDir) && fs.statSync(libDir).isDirectory()) {
        fs.readdirSync(libDir).some((item) => {
          const info = path.parse(item)

          if (['.a', '.lib'].includes(info.ext)) {
            libs.push(info.name)
            return true
          }
          return false
        })
      } else {
        console.warn(`${pkg.name}@${pkg.version} is missing the lib directory`)
      }
      console.log(`collecting ${packageDir}`)
      fs.copySync(packageDir, dest, { dereference: true })
      if (contentDir && fs.existsSync(contentDir)) {
        fs.copySync(contentDir, contentDestDir, { dereference: true })
        console.log(`collecting ${contentDir}`)
      }
    })
  fs.copySync(contentDestDir, lcpkg.project.baseDir, { dereference: true })
  return libs
}

function writePackageUsage(libs) {
  const infile = path.join(__dirname, 'USAGE.md')
  const outfile = path.join(lcpkg.project.workDir, 'USAGE.md')
  const instdir = path.relative(lcpkg.project.baseDir, lcpkg.project.installedDir)
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

  packages.forEach((pkg) => {
    if (pkg.uri.startsWith('vcpkg:')) {
      vcpkgPackages.push(pkg)
    } else if (!fs.existsSync(pkg.packageDir)) {
      downloadPackages.push(pkg)
    }
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
  return { addedPackages: downloadPackages, vcpkgPackages }
}

async function run(args) {
  const dict = {}
  const packages = lcpkg.loadPackages()
  const startTime = Date.now()
  let newPackages = []

  if (args.length > 0) {
    newPackages = await source.resolvePackages(args, {
      linkage: program.staticLink ? 'static' : 'auto',
      platform: lcpkg.platform,
      arch: lcpkg.arch
    })
  }

  const { addedPackages } = await install([
    ...newPackages.map((pkg) => ({
      ...pkg,
      linkage: program.staticLink ? 'static' : 'auto'
    })),
    ...packages
  ].filter((pkg) => {
    if (dict[pkg.name]) {
      return false
    }
    dict[pkg.name] = true
    return true
  }))

  const libs = collectInstalledPackages(packages)
  const file = writePackageUsage(libs)

  console.log(addedPackages.map(({ name, version, triplet }) =>
    `+ ${name}@${version}:${triplet}`).join('\n'))
  console.log(format(
    'added %d packages in %ds',
    addedPackages.length,
    (Date.now() - startTime) / 1000
  ))
  console.log(`to find out how to use them, please see:\n${file}`)
}

program
  .usage('[options] <pkg...>')
  .option('--static-link', 'link to static library')

addArchOption(program)
addPlatformOption(program)

program
  .action(() => {
    lcpkg.setup(program)
    lcpkg.load()
    run(program.args.filter(arg => typeof arg === 'string'))
  })
  .parse(process.argv)
