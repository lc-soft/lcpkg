# LCPkg

([English](README.md)/**中文**)

一个用于管理 Windows C/C++ 项目依赖的命令行工具，它能够：

- 从 vpckg 或 GitHub 安装依赖包
- 记录你项目的相关信息以及依赖库信息
- 将资源文件、头文件、库文件打包，方便其他人安装

[![Screenshot](assets/lcpkg-screenshot.gif)](assets/lcpkg-screenshot.gif)

## 快速上手

先安装依赖:

- [NodeJS](https://nodejs.org/en/)
- [Vcpkg](https://github.com/microsoft/vcpkg)

然后安装 lcpkg:

    npm install -g lcpkg

设置 vcpkg 的根目录路径:

    lcpkg config vcpkg.root /path/to/vcpkg

进入你的项目目录:

    cd /path/to/your/project

告诉 lcpkg 你的项目信息并创建 lcpkg.json 配置文件:

    lcpkg init

使用下面这样的命令安装你需要的依赖包:

    lcpkg install sdl2 curl

如果你的项目是一个 C/C++ 库并想发布给其他开发者使用，你可以打包它：

    lcpkg pack

这个命令会打包头文件、库文件等开发所需的文件，然后输出像下面这样的包文件:

    dist/yourlib_all.lcpkg.zip
    dist/yourlib_x86-windows.lcpkg.zip
    dist/yourlib_x64-windows.lcpkg.zip
    dist/yourlib_x86-uwp.lcpkg.zip
    dist/yourlib_x64-uwp.lcpkg.zip

`yourlib_all.lcpkg.zip` 文件是你项目支持的所有平台和架构版本包的集合, 你可以这样安装它:

    lcpkg install /path/to/yourlib_all.lcpkg.zip

如果你的项目是一个开源项目并且托管在 GitHub.com 上，你可以在每次发布发行版时将这些文件上传到发行版附件中，然后告诉你的用户这样安装你的包：

    lcpkg install github.com/yourusername/yourlib

`yourlib_all.lcpkg.zip` 文件的体积通常很大，我们建议你上传除它以外的文件，这样你的用户就不会花费太多时间在下载上。

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
