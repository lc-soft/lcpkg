/* eslint-disable func-names */
/* eslint-env mocha */
const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const { exec } = require('child_process');
const { homedir } = require('os');

describe('lcpkg', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');

  before(() => {
    fs.removeSync(path.resolve(fixturesDir, 'project', 'lcpkg'));
    fs.removeSync(path.resolve(fixturesDir, 'project-no-deps', 'lcpkg'));
  });

  describe('install', () => {
    it('should install the package recorded in lcpkg.json', function (done) {
      const cwd = path.resolve(fixturesDir, 'project');
      const libDir = path.resolve(cwd, 'lcpkg/installed/x86-windows/lib');

      this.timeout(120000);
      exec('lcpkg install', { cwd }, (err) => {
        assert.strictEqual(!err, true, err && err.message);
        assert.strictEqual(fs.existsSync(libDir), true, `${libDir} should exist`);
        assert.deepStrictEqual(fs.readdirSync(libDir).sort(), ['LCUI.lib', 'LCUIMain.lib', 'lzma.lib']);
        done();
      });
    });
    it('should install the package specified in the command line arguments', function (done) {
      const cwd = path.resolve(fixturesDir, 'project-no-deps');
      const binDir = path.resolve(cwd, 'lcpkg/installed/x86-windows/bin');
      const configFile = path.resolve(cwd, 'lcpkg.json');

      this.timeout(120000);
      exec('lcpkg install sqlite3 github.com/lc-soft/LCUI', { cwd }, (err) => {
        assert.strictEqual(!err, true, err && err.message);
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        const keys = Object.keys(config.dependencies).sort();
        assert.deepStrictEqual(keys, ['LCUI', 'sqlite3']);
        assert.strictEqual(fs.existsSync(binDir), true, `${binDir} should exist`);
        assert.deepStrictEqual(fs.readdirSync(binDir).sort(), ['LCUI.dll', 'LCUI.pdb', 'sqlite3.dll', 'sqlite3.pdb']);
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
        assert.strictEqual(fs.existsSync(targetDir), true, `${targetDir} should exists`);
        assert.strictEqual(fs.existsSync(linkDir), true, `${linkDir} should exists`);
        assert.strictEqual(fs.statSync(linkDir).isDirectory(), true, `${linkDir} should be a directory`);
        assert.strictEqual(fs.lstatSync(linkDir).isSymbolicLink(), true, `${linkDir} should be a symbolic link`);
        assert.strictEqual(fs.readlinkSync(linkDir), targetDir);
        done();
      });
    });
  });
  describe('uninstall', () => {
    it('should remove symlink of current package folder', function (done) {
      const cwd = path.resolve(fixturesDir, 'project');
      const linkDir = path.resolve(homedir(), '.lcpkg', 'packages', 'project', '1.0.0');

      this.timeout(5000);
      exec('lcpkg unlink', { cwd }, (err) => {
        assert.strictEqual(!err, true, err);
        assert.strictEqual(fs.existsSync(linkDir), false, `${linkDir} should be removed`);
        done();
      });
    });
    it('should remove packages', function (done) {
      this.timeout(5000);
      const cwd = path.resolve(fixturesDir, 'project-no-deps');
      const configFile = path.resolve(cwd, 'lcpkg.json');

      this.timeout(120000);
      exec('lcpkg uninstall sqlite3 LCUI', { cwd }, (err) => {
        assert.strictEqual(!err, true, err && err.message);
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        const keys = Object.keys(config.dependencies).sort();
        assert.deepStrictEqual(keys, []);
        done();
      });
    });
  });
});
