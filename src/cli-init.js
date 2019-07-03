const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const prompts = require('prompts')
const userName = require('git-user-name')()
const userEmail = require('git-user-email')()
const program = require('commander')

const PKG_FILE = 'lcpkg.json'

const notice =
`This utility will walk you through creating a ${PKG_FILE} file.
It only covers the most common items, and tries to guess sensible defaults.

Use \`lcpkg install <pkg>\` afterwards to install a package and
save it as a dependency in the ${PKG_FILE} file.

Press ^C at any time to quit.`

async function run() {
  console.log(notice)

  const config = await prompts([
    {
      name: 'name',
      type: 'text',
      message: 'package name:',
      initial: path.basename(process.cwd())
    },
    {
      name: 'version',
      type: 'text',
      message: 'version:',
      initial: '1.0.0'
    },
    {
      name: 'description',
      type: 'text',
      message: 'description:'
    },
    {
      name: 'author',
      type: 'text',
      message: 'author:',
      initial: userName ? `${userName}${userEmail ? `<${userEmail}>` : ''}` : ''
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
      ]
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
      ]
    }
  ])
  let result = await prompts({
    name: 'pack',
    type: 'confirm',
    message: 'Is your software a C or C++ library that needs to be packaged and distributed?',
    initial: true
  })

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
        initial: 'include'
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
        initial: 'build/${arch}-${platform}/${mode}'
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
        initial: 'build/${arch}-${platform}/${mode}'
      },
      {
        name: 'output',
        type: 'text',
        message: 'Where do you want to output the packaged file?',
        initial: 'dist'
      }
    ])

    config.package = {
      output: packConfig.output,
      entry: {
        lib: packConfig.lib,
        bin: packConfig.bin,
        include: packConfig.include
      }
    }
  }

  const file = path.join(process.cwd(), PKG_FILE)
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
  })

  fs.writeFileSync(file, content)
}

program.action(run).parse(process.argv)
