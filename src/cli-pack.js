const program = require('commander');
const { Packer } = require('./packer');

program
  .usage('[options]')
  .option('-v, --verbose', 'enable verbose output', false)
  .action(() => {
    new Packer({ verbose: program.verbose }).run();
  })
  .parse(process.argv);
