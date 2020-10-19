function addArchOption(program) {
  program.option(
    '--arch <name>',
    'specify which CPU architecture package to use',
    (name, defaultName) => {
      if (['x86', 'x64', 'arm'].indexOf(name) < 0) {
        console.error(`invalid arch: ${name}`);
        return defaultName;
      }
      return name;
    },
    process.platform === 'win32' ? 'x86' : 'x64'
  );
}

function addPlatformOption(program) {
  if (process.platform !== 'win32') {
    return;
  }
  program.option('--platform <name>', 'specify the platform', (name, defaultName) => {
    if (!['windows', 'uwp'].includes(name)) {
      console.error(`invalid platform: ${name}`);
      return defaultName;
    }
    return name;
  }, 'windows');
}

function addModeOption(program) {
  program.option('--mode <mode>', 'specify the mode', (mode, defaultMode) => {
    if (!['debug', 'release'].includes(mode.toLowerCase())) {
      console.error(`invalid mode: ${mode}`);
      return defaultMode;
    }
    return mode.toLowerCase();
  }, 'release');
}

module.exports = {
  addArchOption,
  addPlatformOption,
  addModeOption
};
