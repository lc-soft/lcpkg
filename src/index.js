/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Conf = require('conf');
const { homedir } = require('os');
const config = require('./config');
const { name: appName } = require('../package.json');

const schema = {
  vcpkg: {
    type: 'object',
    properties: {
      root: {
        type: 'string'
      }
    }
  }
};

function resolve() {
  let workDir = process.cwd();

  do {
    const info = path.parse(workDir);
    const file = path.join(workDir, config.configFileName);

    if (fs.existsSync(file)) {
      return file;
    }
    if (info.dir === info.root) {
      break;
    }
    workDir = info.dir;
  } while (workDir);
  throw new Error(`${config.configFileName} file is not found`);
}

function load(file) {
  const { ext } = path.parse(file);

  if (ext === '.json') {
    return JSON.parse(fs.readFileSync(file));
  } if (ext === '.js') {
    return require(file);
  }
  throw new Error(`${file}: invalid format`);
}

function mkdir(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath);
  }
  return dirpath;
}

function createEnvironment() {
  const rootDir = mkdir(path.join(homedir(), `.${appName}`));
  const packagesDir = mkdir(path.join(rootDir, 'packages'));
  const downloadsDir = mkdir(path.join(rootDir, 'downloads'));
  return { rootDir, packagesDir, downloadsDir };
}

function createProjectEnvironment(file) {
  const baseDir = path.dirname(file);
  const workDir = mkdir(path.join(baseDir, 'lcpkg'));
  const portsDir = mkdir(path.join(workDir, 'ports'));
  const installedDir = mkdir(path.join(workDir, 'installed'));
  const packageOutputDir = mkdir(path.join(workDir, 'dist'));
  return {
    file, baseDir, workDir, portsDir, installedDir, packageOutputDir
  };
}

class LCPkg {
  constructor() {
    this.cfg = new Conf({ projectName: 'lcpkg', schema });
    this.env = createEnvironment();
    this.project = null;
    this.pkg = { name: 'unknown', version: 'unknown' };
    this.arch = 'x86';
    this.platform = process.platform === 'win32' ? 'windows' : process.platform;
  }

  get triplet() {
    return `${this.arch}-${this.platform}`;
  }

  resolvePackage({
    name, uri, linkage, ...pkg
  }) {
    let contentDir = null;
    let packageDir = null;
    let sourcePath = null;
    let { triplet } = this;
    const vcpkgRoot = this.cfg.get('vcpkg.root');
    const version = pkg.version.startsWith('v') ? pkg.version.substr(1) : pkg.version;

    if (this.platform === 'windows' && linkage === 'static') {
      triplet += '-static';
    }
    if (uri.startsWith('vcpkg:')) {
      packageDir = path.resolve(vcpkgRoot, 'packages', `${name}_${triplet}`);
    } else {
      packageDir = path.resolve(this.env.packagesDir, name, version);
      contentDir = path.join(packageDir, 'content');
      packageDir = path.resolve(packageDir, triplet);
      if (uri.startsWith('github:')) {
        sourcePath = path.resolve(
          this.env.downloadsDir,
          'github.com',
          uri.substr(7).split('/')[0],
          `${name}-${version}_source.zip`
        );
      }
    }
    return {
      ...pkg,
      name,
      version,
      uri,
      linkage,
      triplet,
      sourcePath,
      packageDir,
      contentDir
    };
  }

  loadPackages() {
    const deps = this.pkg.dependencies || [];
    return Object.keys(deps).map((name) => this.resolvePackage({ name, ...deps[name] }));
  }

  setup(program) {
    this.arch = program.arch;
    if (program.platform) {
      this.platform = program.platform;
    }
  }

  load() {
    const file = resolve();
    this.project = createProjectEnvironment(file);
    this.pkg = load(file);
    if (this.pkg.package && this.pkg.package.output) {
      this.env.packageOutputDir = this.pkg.package.output;
    }
  }

  save() {
    fs.writeFileSync(this.project.file, JSON.stringify(this.pkg, null, 2));
  }
}

const lcpkg = new LCPkg();

module.exports = lcpkg;
