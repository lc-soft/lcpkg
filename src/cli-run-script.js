const program = require('commander');
const { runScript } = require('./run-script');

program
  .arguments('<scriptName>')
  .action(runScript)
  .parse(process.argv);
