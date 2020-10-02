const fs = require('fs-extra');
const path = require('path');
const lcpkg = require('./index');

const devItems = ['include', 'lib', 'bin'];

class PackEntry {
  constructor({
    name, data, env, verbose
  }) {
    this.env = env;
    this.name = name;
    this.verbose = verbose;
    this.data = typeof data === 'string' ? { input: data } : data;
    if (name === 'include' || name === 'content') {
      if (typeof this.data.recursive === 'undefined') {
        this.data.recursive = true;
      }
    }
  }

  get input() {
    return this.replaceVaribales(path.resolve(path.join(lcpkg.project.baseDir, this.data.input)));
  }

  get triplet() {
    return `${this.env.arch}-${this.env.platform}`;
  }

  get extensions() {
    if (this.data.extensions instanceof Array) {
      return this.data.extensions;
    }
    if (this.name === 'lib') {
      if (process.platform === 'win32') {
        return ['.lib'];
      }
      return ['.a'];
    }
    if (this.name === 'bin') {
      if (process.platform === 'win32') {
        return ['.dll', '.pdb'];
      }
      return ['.so'];
    }
    if (this.name === 'include') {
      return ['.h'];
    }
    return [];
  }

  replaceVaribales(str) {
    return ['arch', 'platform', 'mode'].reduce((input, key) => {
      if (this.env[key]) {
        return input.replace(`\${${key}}`, this.env[key]);
      }
      return input;
    }, str);
  }

  testFile(file) {
    const info = path.parse(file);

    if (
      this.data.targets instanceof Array
      && !this.data.targets.includes(info.name)
    ) {
      return false;
    }
    if (this.extensions.length < 1) {
      return true;
    }
    return this.extensions.includes(info.ext);
  }

  copyFiles(input, output) {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true });
    }
    if (!fs.existsSync(input)) {
      return;
    }
    fs.readdirSync(input).forEach((file) => {
      const srcPath = path.join(input, file);
      const destPath = path.join(output, file);
      const stat = fs.statSync(srcPath);

      if (this.data.recursive && stat.isDirectory()) {
        this.copyFiles(srcPath, destPath);
        return;
      }
      if (this.testFile(srcPath)) {
        if (this.verbose) {
          console.log(`copy ${path.relative(lcpkg.project.baseDir, srcPath)} -> ${destPath}`);
        }
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  build() {
    const { input } = this;
    let output = this.env.targetdir;

    if (devItems.includes(this.name)) {
      output = path.join(output, this.triplet);
      if (this.env.mode === 'debug') {
        if (this.name === 'include') {
          return;
        }
        output = path.join(output, this.env.mode, this.name);
      } else {
        output = path.join(output, this.name);
      }
    } else {
      output = path.join(output, this.name);
    }
    this.copyFiles(input, output);
  }
}

module.exports = {
  PackEntry
};
