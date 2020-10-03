# LCPkg

[![npm](https://img.shields.io/npm/v/lcpkg)](http://npmjs.com/package/lcpkg)
[![Build Status](https://travis-ci.org/lc-soft/lcpkg.svg?branch=develop)](https://travis-ci.org/lc-soft/lcpkg)
[![Coverage Status](https://coveralls.io/repos/github/lc-soft/lcpkg/badge.svg?branch=develop)](https://coveralls.io/github/lc-soft/lcpkg?branch=develop)

(**English**/[中文](README.zh-cn.md))

LCPkg (**LC**'s **P**ac**k**a**g**e Manager) is a command line tool for manage Windows C/C++ project dependencies, it is able to:

- Install dependencies from [Vcpkg](https://github.com/microsoft/vcpkg) or GitHub.
- Save information about your project and its dependencies.
- Pack resource files, header files and library files into a package file to make your project easier to install.

## Quick Start

Prerequisites:

- [Node.js](https://nodejs.org/en/)
- [Vcpkg](https://github.com/microsoft/vcpkg)

To get started:

    npm install -g lcpkg

Tell lcpkg where the root directory of vcpkg is:

    lcpkg config vcpkg.root /path/to/vcpkg

Go to your project directory:

    cd /path/to/your/project

Tell lcpkg about your project information:

    lcpkg init

Install any packages with:

    lcpkg install sdl2 curl

The files in these packages will be copied to the lcpkg/installed directory in the project directory. The directory structure is similar to the Vcpkg package：

    x64-windows/
        bin
            libxxx.dll
        debug
            bin
                libxxxd.dll
            lib
                libxxxd.lib
        include
            libxxx.h
        lib
            libxxx.lib

### Export packages

If your project is an application, and its working directory requires the dll files and resource files of the dependent package, you can export them to the working directory:

    lcpkg export --filter runtime /path/to/your/app/workdir

You can also specify which CPU architecture and build mode resource files to export:

    lcpkg export --filder rumtime --arch x64 --mode debug /path/to/your/app/workdir

### Package C/C++ library project

If your project is a C/C++ library, and want to publish it to other developers, you can package it:

    lcpkg pack

This command will output some files like this:

    dist/yourlib_all.lcpkg.zip
    dist/yourlib_x86-windows.lcpkg.zip
    dist/yourlib_x64-windows.lcpkg.zip
    dist/yourlib_x86-uwp.lcpkg.zip
    dist/yourlib_x64-uwp.lcpkg.zip

The `yourlib_all.lcpkg.zip` file includes packages for all platforms and architectures, you can install it like this:

    lcpkg install /path/to/yourlib_all.lcpkg.zip

If your project is an open source project and hosted on GitHub.com, you can upload them to the release assets each time you post a release note, and tell your users install it like this:

    lcpkg install github.com/yourusername/yourlib

The `yourlib_all.lcpkg.zip` file is usually large, We recommend you upload files other than it, so that users don't have to wait too long for downloading.

### Debug C/C++ library project locally

The approach of lcpkg is similar to that of npm. It maps local development projects in the form of symbolic links to the global package directory for application projects, but is limited by the directory structure of C/C++ projects and the dependency search rules of the build tool. Some additional commands are needed to synchronize the dependent package files.

Symlink current package directory to global package directory:

    lcpkg link

Then repackage to update the package files every time the library is built:

    lcpkg pack

And update the dependent library files in the application project:

    lcpkg install

## FAQ

- **Vcpkg is awesome, why should I use LCPkg instead of Vcpkg?**

  In the current version, LCPkg doesn't have any appealing features, For the author, its main use is help other developers to download and install the binary packages of [LCUI](https://github.com/lc-soft/lLCUI) and [LC Design](https://github.com/lc-ui/lc-design). But if you happen to meet the following conditions, you can try LCPkg.

  - Have a C/C++ library project that you need to publish to other developers.
  - The build tool used in the project is not CMake, and you don't want to learn CMake.
  - Some tools written in JavaScript are used in your project, and the Node.js has already been installed.

## Contribute

There are many ways to [contribute](CONTRIBUTING.md) to LCPkg.

- [Submit bugs](https://github.com/lc-soft/lcpkg/issues) and help us verify fixes as they are checked in.
- Vote and discuss participation in feature requests.
- Review the [source code changes](https://github.com/lc-soft/lcpkg/pulls).
- [Contribute bug fixes](CONTRIBUTING.md).

LCPkg has adopted the code of conduct defined by the Contributor Covenant. This document is used across many open source communities, and we think it articulates our values well. For more, see the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Code licensed under the [MIT License](LICENSE).
