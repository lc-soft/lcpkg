const program = require('commander')
const version = require('../package.json').version

program
  .version(version)
  .command('install', 'install one or more packages')
  .command('config', 'operate configuration')
  .parse(process.argv)
