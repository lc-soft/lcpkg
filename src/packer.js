const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const config = require('./config');
const lcpkg = require('./index');
const { PackEntry } = require('./pack-entry');

class Packer {
  constructor({ verbose = false }) {
    lcpkg.load();
    this.verbose = verbose;
    this.target = `${lcpkg.pkg.name}-${lcpkg.pkg.version}`;
    this.output = lcpkg.project.packageOutputDir;
  }

  async run() {
    const tasks = [];
    const info = lcpkg.pkg;
    const targetdir = path.join(this.output, this.target);

    if (fs.existsSync(targetdir)) {
      console.log('remove old files');
      fs.removeSync(targetdir);
    }
    fs.mkdirSync(targetdir, { recursive: true });
    if (info.package.entry.content) {
      new PackEntry({
        name: 'content',
        data: info.package.entry.content,
        env: { targetdir },
        verbose: this.verbose
      }).build();
    }
    info.arch.forEach((arch) => {
      info.platform.forEach((platform) => {
        Object.keys(info.package.entry).forEach((name) => {
          if (name === 'content') {
            return;
          }
          info.mode.forEach((mode) => {
            new PackEntry({
              name,
              data: info.package.entry[name],
              env: {
                targetdir, arch, platform, mode
              }
            }).build();
          });
        });
        tasks.push(this.pack.bind(this, arch, platform));
      });
    });
    tasks.push(this.packAll.bind(this));
    return Promise.all(tasks.map((task) => task()));
  }

  pack(arch, platform) {
    const archive = archiver('zip');
    const triplet = `${arch}-${platform}`;
    const zipfile = path.join(this.output, `${this.target}_${triplet}${config.packageFileExt}`);
    const output = fs.createWriteStream(zipfile);
    const contentPath = path.join(this.output, this.target, 'content');

    return new Promise((resolve, reject) => {
      console.log(`create: ${zipfile}`);
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.file(lcpkg.project.file, { name: path.basename(lcpkg.project.file) });
      archive.directory(path.join(this.output, this.target, triplet), triplet);
      if (fs.existsSync(contentPath)) {
        archive.directory(contentPath, 'content');
      }
      archive.finalize();
    });
  }

  packAll() {
    const archive = archiver('zip');
    const zipfile = path.join(this.output, `${this.target}_all${config.packageFileExt}`);
    const output = fs.createWriteStream(zipfile);

    return new Promise((resolve, reject) => {
      console.log(`create: ${zipfile}`);
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.file(lcpkg.project.file, { name: path.basename(lcpkg.project.file) });
      archive.directory(path.join(this.output, this.target), false);
      archive.finalize();
    });
  }
}

module.exports = {
  Packer
};
