const path = require('path');
const fs = require('fs-extra');
const { format } = require('util');
const program = require('commander');
const plural = require('plural');
const lcpkg = require('./index');

function removePackage(name, version) {
  const packages = [];
  const pkgDir = path.resolve(lcpkg.env.packagesDir, name);

  if (!fs.existsSync(pkgDir)) {
    console.warn(`${name} is not installed`);
    return packages;
  }
  if (version) {
    const versionDir = path.join(pkgDir, version);
    if (fs.existsSync(versionDir)) {
      fs.removeSync(versionDir);
      packages.push(`${name}@${version}`);
    } else {
      console.warn(`${name}@${version} is not installed`);
    }
  } else {
    packages.push(...fs.readdirSync(pkgDir).map((ver) => `${name}@${ver.startsWith('v') ? ver.substr(1) : ver}`));
    fs.removeSync(pkgDir);
  }
  return packages;
}

program
  .arguments('[pkg[@<version>]...]')
  .action((args) => {
    const packages = [];
    const startTime = Date.now();

    if (args.length > 0) {
      lcpkg.load();
      if (lcpkg.pkg) {
        args.forEach((arg) => delete lcpkg.pkg.dependencies[arg.split('@')[0]]);
        lcpkg.save();
      } else {
        args.forEach((arg) => packages.push(...removePackage(...arg.split('@'))));
      }
    } else {
      lcpkg.load();
      if (lcpkg.pkg) {
        packages.push(...removePackage(lcpkg.pkg.name, lcpkg.pkg.version));
      }
    }
    packages.forEach((pkg) => {
      console.log(`- ${pkg}`);
    });
    console.log(format(
      'removed %d %s in %ds',
      packages.length,
      plural('package', packages.length),
      (Date.now() - startTime) / 1000
    ));
  })
  .parse(process.argv);
