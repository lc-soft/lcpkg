const fs = require('fs');
const path = require('path');
const program = require('commander');
const homedir = require('os').homedir();
const { execSync } = require('child_process');
const lcpkg = require('./index');

function setup() {
  const reposDir = path.resolve(homedir, '.lcpkg', 'repos');
  const vcpkgDir = path.join(reposDir, 'vcpkg');
  const cmdBootstrap = process.platform === 'win32' ? '.\\bootstrap-vcpkg.bat' : './bootstrap-vcpkg.sh';

  if (!fs.existsSync(reposDir)) {
    fs.mkdirSync(reposDir, { recursive: true });
  }
  if (fs.existsSync(vcpkgDir)) {
    execSync('git pull', { cwd: vcpkgDir, stdio: 'inherit' });
  } else {
    console.log(`downloading vcpkg into ${reposDir}`);
    execSync('git clone https://github.com/Microsoft/vcpkg.git', { cwd: reposDir, stdio: 'inherit' });
  }
  execSync(cmdBootstrap, { cwd: vcpkgDir, stdio: 'inherit' });
  lcpkg.cfg.set('lcpkg.info', vcpkgDir);
}

program
  .action(setup)
  .parse(process.argv);
