# LCPkg

[![npm](https://img.shields.io/npm/v/lcpkg)](http://npmjs.com/package/lcpkg)
[![Build Status](https://travis-ci.org/lc-soft/lcpkg.svg?branch=develop)](https://travis-ci.org/lc-soft/lcpkg)
[![Coverage Status](https://coveralls.io/repos/github/lc-soft/lcpkg/badge.svg?branch=develop)](https://coveralls.io/github/lc-soft/lcpkg?branch=develop)

([English](README.md)/**中文**)

LCPkg (**LC**'s **P**ac**k**a**g**e Manager) 是一个用于管理 Windows C/C++ 项目依赖的命令行工具。它能够：

- 从 vcpkg 和 GitHub 安装依赖包
- 记录你项目的相关信息以及依赖库信息
- 将资源文件、头文件、库文件打包，方便其他人安装

## 快速上手

先安装依赖:

- [Node.js](https://nodejs.org/en/)
- [Vcpkg](https://github.com/microsoft/vcpkg)

然后安装 lcpkg:

    npm install -g lcpkg

设置 vcpkg 的根目录路径:

    lcpkg config vcpkg.root /path/to/vcpkg

进入你的项目目录:

    cd /path/to/your/project

告诉 lcpkg 你的项目信息并创建 lcpkg.json 配置文件:

    lcpkg init

使用如下命令安装你需要的依赖包:

    lcpkg install sdl2 curl

安装后这些依赖包的文件会被复制到项目目录中的 lcpkg/installed 目录中，目录结构和 vcpkg 的包相似：

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

接下来请修改你的项目的构建配置，将该目录添加到头文件包含目录和附加依赖库目录中，但需要注意的是，release 和 debug 版本的库目录路径不一样，而且有些 vcpkg 构建的 debug 版本的库文件名后面是有 d 字符的，例如：`libpng16d.lib`，这意味着你可能需要针对 release 和 debug 写两份配置。

### 导出依赖库

如果你的项目是一个应用程序，其工作目录中需要依赖库的 dll 文件和资源文件，则可以导出它们到工作目录中：

    lcpkg export --filter runtime /path/to/your/app/workdir

也可以指定导出何种 CPU 架构和构建模式的资源文件：

    lcpkg export --filder rumtime --arch x64 --mode debug /path/to/your/app/workdir

### 打包 C/C++ 库项目

如果你想将自己的 C/C++ 库项目发布给其他开发者使用，你可以打包它：

    lcpkg pack

这个命令会打包头文件、库文件等开发所需的文件，然后输出像下面这样的包文件:

    dist/yourlib_all.lcpkg.zip
    dist/yourlib_x86-windows.lcpkg.zip
    dist/yourlib_x64-windows.lcpkg.zip
    dist/yourlib_x86-uwp.lcpkg.zip
    dist/yourlib_x64-uwp.lcpkg.zip

`yourlib_all.lcpkg.zip` 文件是你项目支持的所有平台和架构版本包的集合, 你可以这样安装它:

    lcpkg install /path/to/yourlib_all.lcpkg.zip

如果你的项目是一个开源项目并且托管在 GitHub.com 上，则可以在每次发布发行版时将这些文件上传到发行版附件中，然后告诉你的用户这样安装你的包：

    lcpkg install github.com/yourusername/yourlib

`yourlib_all.lcpkg.zip` 文件的体积通常很大，我们建议你上传除它以外的文件，这样你的用户就不会花费太多时间在下载上。

### 在本地调试 C/C++ 库项目

lcpkg 的做法和 npm 相似，将本地开发的项目以符号链接的形式映射到全局包目录供应用程序项目使用，但受限于 C/C++ 项目的目录结构和构建工具的依赖查找机制，lcpkg 还需要额外的一些命令去实现依赖包文件的同步。

将 C/C++ 库项目的打包目录符号链接到全局包目录：

    lcpkg link

之后在每次构建完该库时重新打包以更新包的文件：

    lcpkg pack

并在应用程序项目中更新依赖库的文件：

    lcpkg install

## 常见问题

- **Vcpkg 已经很好用了，为什么要用 LCPkg？**

  从现在的情况看来，LCPkg 相当于 Vcpkg 的扩展，没什么值得一用的特色功能，对于作而言，其主要的用途也就是方便其他开发者下载安装 [LCUI](https://github.com/lc-soft/lLCUI) 和 [LC Design](https://github.com/lc-ui/lc-design) 的二进制包，但如果你正好符合以下条件，则可以试试 LCPkg。

  - 未使用 vcpkg 管理 C/C++ 依赖库。
  - 有需要发布给其他开发者使用的 C/C++ 库项目。
  - 项目中用的构建工具不是 CMake，懒得花时间学习 CMake。
  - 项目中用到了一些 JavaScript 编写的工具，已安装 Node.js 环境。

## 贡献

有很多方式[参与贡献](CONTRIBUTING.zh-cn.md) LCPkg

- [反馈问题](https://github.com/lc-soft/lcpkg/issues)并在问题关闭时帮助我们验证它们是否已经修复
- 参与功能设计相关问题的投票和讨论
- 审查[源代码的改动](https://github.com/lc-soft/lcpkg/pulls)
- 在 [开源问答](https://www.oschina.net/question/ask)、[思否](https://segmentfault.com/)上与其他 LCPkg 用户和开发人员交流
- [修复已知问题](CONTRIBUTING.zh-cn.md)

本项目采用了参与者公约定义的行为准则，该文档应用于许多开源社区，有关更多信息，请参阅[《行为准则》](CODE_OF_CONDUCT.zh-cn.md)。

## 许可

代码基于 [MIT 许可协议](LICENSE) 发布。
