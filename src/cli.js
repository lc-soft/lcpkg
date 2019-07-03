const program = require('commander')
const version = require('../package.json').version

program
  .version(version)
  .command('init', 'create a lcpkg.json file')
  .command('install', 'install one or more packages')
  .command('pack', 'create a zipball from a package')
  .command('config', 'operate configuration')
  .parse(process.argv)
