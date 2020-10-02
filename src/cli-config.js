const program = require('commander');
const lcpkg = require('./index');

program
  .usage('<name> <value>')
  .parse(process.argv);

if (program.args.length === 1) {
  console.log(lcpkg.cfg.get(program.args[0]) || '');
} else if (program.args.length === 2) {
  lcpkg.cfg.set(program.args[0], program.args[1] || '');
}
