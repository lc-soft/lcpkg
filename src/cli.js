const program = require('commander');
const { version } = require('../package.json');

program
  .version(version)
  .command('init', 'create a lcpkg.json file')
  .command('install', 'install one or more packages')
  .command('pack', 'create a zipball from a package')
  .command('run-script', 'run arbitrary package scripts')
  .alias('run')
  .command('setup', 'setup lcpkg to make it work properly')
  .command('export', 'export dependent files')
  .command('link', 'symlink a package folder')
  .command('uninstall', 'remove a package')
  .alias('unlink')
  .command('config', 'operate configuration')
  .parse(process.argv);
