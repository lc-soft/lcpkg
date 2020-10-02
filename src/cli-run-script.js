const program = require('commander');
const { runScript } = require('./run-script');

program
  .usage('<script name>')
  .action(runScript)
  .parse(process.argv);
