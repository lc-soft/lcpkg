const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const prompts = require('prompts')
const userName = require('git-user-name')()
const userEmail = require('git-user-email')()
const program = require('commander')
const pkgfile = require('./config').configFileName

const notice =
`This utility will walk you through creating a ${pkgfile} file.
It only covers the most common items, and tries to guess sensible defaults.

Use \`lcpkg install <pkg>\` afterwards to install a package and
save it as a dependency in the ${pkgfile} file.

Press ^C at any time to quit.`

async function run() {
  let aborted = false
  let defaults = {
    name: path.basename(process.cwd()),
    version: '1.0.0',
    description: '',
    author: userName ? `${userName}${userEmail ? `<${userEmail}>` : ''}` : '',
    arch: [],
    package: {
      output: 'lcpkg/dist',
      entry: {
        include: 'include',
        lib: 'build/${arch}-${platform}/${mode}',
        bin: 'build/${arch}-${platform}/${mode}',
      }
    }
  }
  const file = path.join(process.cwd(), pkgfile)

  console.log(notice)
  if (fs.existsSync(file)) {
    const pkg = defaults.package

    defaults = Object.assign({}, defaults, JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' })))
    if (!defaults.package) {
      defaults.package = pkg
    }
  }
  const config = await prompts([
    {
      name: 'name',
      type: 'text',
      message: 'package name:',
      initial: defaults.name
    },
    {
      name: 'version',
      type: 'text',
      message: 'version:',
      initial: defaults.version
    },
    {
      name: 'description',
      type: 'text',
      message: 'description:',
      initial: defaults.description,
    },
    {
      name: 'author',
      type: 'text',
      message: 'author:',
      initial: defaults.author
    },
    {
      name: 'arch',
      type: 'multiselect',
      message: 'What CPU architectures does your code run on?',
      choices: [
        {
          title: 'x86',
          value: 'x86'
        },
        {
          title: 'x64',
          value: 'x64'
        },
        {
          title: 'arm',
          value: 'arm'
        }
      ],
      initial: defaults.arch
    },
    {
      name: 'platform',
      type: 'multiselect',
      message: 'What platform does your code run on?',
      choices: [
        {
          title: 'Windows',
          value: 'windows'
        },
        {
          title: 'UWP (Universal Windows Platform)',
          value: 'uwp'
        },
        {
          title: 'Linux',
          value: 'linux'
        },
        {
          title: 'Mac OS',
          value: 'osx'
        }
      ],
      initial: defaults.platform
    }
  ], {
    onCancel: () => { aborted = true }
  })

  if (aborted) {
    return false
  }

  config.mode = ['debug', 'release']

  let result = await prompts({
    name: 'pack',
    type: 'confirm',
    message: 'Is your software a C or C++ library that needs to be packaged and distributed?',
    initial: true
  }, {
    onCancel: () => { aborted = true }
  })

  if (aborted) {
    return false
  }
  if (result.pack) {
    const packConfig = await prompts([
      {
        name: 'include',
        type: 'text',
        message: () => {
          return 'Where is the public header file directory?\n' + chalk.reset([
            'For example, you have these public header files:\n',
            `\tinclude/${config.name}/config.h`,
            `\tinclude/${config.name}/utils.h`,
            `\tinclude/${config.name}.h`,
            '\nThese files are in the include directory, so you should enter \'include\'.\n'
          ].join('\n'))
        },
        initial: defaults.package.entry.include
      },
      {
        name: 'lib',
        type: 'text',
        message: () => {
          return 'where is static library output directory?\n' + chalk.reset([
            'For example, these files are output when your library is built:\n',
            `\tbuild/x86-windows/debug/${config.name}.lib`,
            `\tbuild/x86-windows/release/${config.name}.lib`,
            `\tbuild/x64-windows/debug/${config.name}.lib`,
            `\tbuild/x64-windows/release/${config.name}.lib`,
            `\tbuild/x64-uwp/debug/${config.name}.lib`,
            `\tbuild/x64-uwp/release/${config.name}.lib`,
            '\nThe format of the file path is \'build/${arch}-${platform}/${mode}\', so you should enter it.\n'
          ].join('\n'))
        },
        initial: defaults.package.entry.lib
      },
      {
        name: 'bin',
        type: 'text',
        message: () => {
          return 'where is binary output directory?\n' + chalk.reset([
            'For example, these files are output when your library is built:\n',
            `\tbuild/x86-windows/debug/${config.name}.dll`,
            `\tbuild/x86-windows/debug/${config.name}.pdb`,
            `\tbuild/x64-windows/release/${config.name}.dll`,
            `\tbuild/x64-uwp/debug/${config.name}.dll`,
            `\tbuild/x64-uwp/debug/${config.name}.pdb`,
            '\nThe format of the file path is \'build/${arch}-${platform}/${mode}\', so you should enter it.\n'
          ].join('\n'))
        },
        initial: defaults.package.entry.bin
      },
      {
        name: 'content',
        type: 'text',
        message: 'Where is the content directory?\n' + chalk.reset(
          'All files in this directory will be copied to the project root after package installation.\n'
        ),
        initial: defaults.package.entry.content
      },
      {
        name: 'output',
        type: 'text',
        message: 'Where do you want to output the packaged file?',
        initial: defaults.package.output
      }
    ])

    config.package = {
      output: packConfig.output,
      entry: {
        lib: packConfig.lib,
        bin: packConfig.bin,
        content: packConfig.content,
        include: packConfig.include
      }
    }
  }

  const content = JSON.stringify(config, null, 2)

  result = await prompts({
    name: 'pass',
    type: 'confirm',
    initial: true,
    message: () => {
      return [
        `About to write to ${file}:\n`,
        `${chalk.reset(content)}\n`,
        `${chalk.bold('Is this OK?')}`
      ].join('\n')
    }
  }, {
    onCancel: () => { aborted = true }
  })

  if (result.pass && !aborted) {
    fs.writeFileSync(file, content)
    return true
  }
  return false
}

program.action(async () => {
  if (!(await run())) {
    console.log('lcpkg init canceled')
  }
}).parse(process.argv)
