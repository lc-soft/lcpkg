const { execSync } = require('child_process')
const lcpkg = require('./index')

function runScript(name) {
  lcpkg.load()
  if (!lcpkg.pkg.scripts || !lcpkg.pkg.scripts[name]) {
    console.error(`missing script: ${name}`)
    return  
  }
  console.log(lcpkg.pkg.scripts[name])
  execSync(lcpkg.pkg.scripts[name], { stdio: 'inherit' })
}

module.exports = {
  runScript
}
