const { execSync } = require('child_process');
const lcpkg = require('./index');

function runScript(name) {
  lcpkg.load();
  if (!lcpkg.pkg.scripts || !lcpkg.pkg.scripts[name]) {
    console.error(`missing script: ${name}`);
    return;
  }

  const script = lcpkg.pkg.scripts[name];
  const params = process.argv.slice(3).join(' ');

  console.log(script, params);
  execSync(`${script} ${params}`, { stdio: 'inherit' });
}

module.exports = {
  runScript
};
