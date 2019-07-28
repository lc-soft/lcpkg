# LCPkg

(**English**/[中文](README.zh-cn.md))

A command line tool for manage Windows C/C++ project dependencies.

[![Screenshot](assets/lcpkg-screenshot.gif)](assets/lcpkg-screenshot.gif)

## Quick Start

Prerequisites:

- [NodeJS](https://nodejs.org/en/)
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

## Contribute

There are many ways to [contribute](CONTRIBUTING.md) to LCPkg.

- [Submit bugs](https://github.com/lc-soft/lcpkg/issues) and help us verify fixes as they are checked in.
- Vote and discuss participation in feature requests.
- Review the [source code changes](https://github.com/lc-soft/lcpkg/pulls).
- [Contribute bug fixes](CONTRIBUTING.md).

LCPkg has adopted the code of conduct defined by the Contributor Covenant. This document is used across many open source communities, and we think it articulates our values well. For more, see the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Code licensed under the [MIT License](LICENSE).
