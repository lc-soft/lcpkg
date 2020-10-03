/* eslint-disable func-names */
/* eslint-env mocha */
const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const { exec } = require('child_process');
const { homedir } = require('os');

function checkFiles(files, cwd, dir) {
  return files.every((file) => fs.existsSync(path.resolve(cwd, dir, file)));
}

describe('lcpkg', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');

  after(() => {
    fs.removeSync(path.resolve(fixturesDir, 'project', 'lcpkg'));
    fs.removeSync(path.resolve(fixturesDir, 'project-no-deps', 'lcpkg'));
  });

  describe('install', () => {
    it('should install the package recorded in lcpkg.json', function (done) {
      const binDir = 'lcpkg/installed/x86-windows/bin';
      const expectFiles = ['LCUI.dll', 'libpng16.dll', 'zlib1.dll'];
      const cwd = path.resolve(fixturesDir, 'project');

      this.timeout(120000);
      exec('lcpkg install', { cwd }, (err) => {
        assert.strictEqual(!err, true, 'command should executed successfully');
        assert.strictEqual(checkFiles(expectFiles, cwd, binDir), true);
        done();
      });
    });
    it('should install the package specified in the command line arguments', function (done) {
      const binDir = 'lcpkg/installed/x86-windows/bin';
      const expectFiles = ['LCUI.dll', 'sqlite3.dll'];
      const cwd = path.resolve(fixturesDir, 'project-no-deps');
      const configFile = path.resolve(cwd, 'lcpkg.json');

      this.timeout(120000);
      exec('lcpkg install sqlite3 github.com/lc-soft/LCUI', { cwd }, (err) => {
        assert.strictEqual(!err, true, err && err.message);
        assert.strictEqual(checkFiles(expectFiles, cwd, binDir), true);
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        const keys = Object.keys(config.dependencies).sort();
        assert.deepStrictEqual(keys, ['LCUI', 'sqlite3']);
        done();
      });
    });
    it('should download the source package when specifying the --save-source option', function (done) {
      const cwd = path.resolve(fixturesDir, 'project');
      const sourcePath = path.resolve(cwd, 'lcpkg/installed/source/LCUI/src/main.c');

      this.timeout(120000);
      exec('lcpkg install github.com/lc-soft/LCUI --save-source', { cwd }, (err) => {
        assert.strictEqual(!err, true, err && err.message);
        assert.strictEqual(fs.existsSync(sourcePath), true);
        done();
      });
    });
  });
  describe('link', () => {
    it('should symlink current package folder', function (done) {
      const cwd = path.resolve(fixturesDir, 'project');
      const targetDir = path.resolve(cwd, 'lcpkg', 'dist', 'project-1.0.0');
      const linkDir = path.resolve(homedir(), '.lcpkg', 'packages', 'project', '1.0.0');

      this.timeout(5000);
      exec('lcpkg link', { cwd }, (err) => {
        assert.strictEqual(!err, true, err && err.message);
        assert.strictEqual(fs.existsSync(targetDir), true);
        assert.strictEqual(fs.existsSync(linkDir), true);
        assert.strictEqual(fs.statSync(linkDir).isDirectory(), true);
        assert.strictEqual(fs.lstatSync(linkDir).isSymbolicLink(), true);
        assert.strictEqual(fs.readlinkSync(linkDir), targetDir);
        done();
      });
    });
  });
});
